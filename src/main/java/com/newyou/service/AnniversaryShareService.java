package com.newyou.service;

import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.newyou.entity.AnniversaryShare;
import com.newyou.entity.User;
import com.newyou.repository.AnniversaryShareRepository;
import com.newyou.repository.FriendRepository;
import com.newyou.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * 💝 기념일 함께 보기
 *  - 내 기본 기념일을 서버에 저장해요 (PUT /api/anniversary/mine)
 *  - 나를 연결해 둔 친구의 기념일을 볼 수 있어요 (GET /api/anniversary/friend/{userId})
 *    → 상태(스토리)와 같은 규칙: 주인이 나를 아이디로 연결했고, '보여주기'를 켰을 때만
 */
@Service
@RequiredArgsConstructor
public class AnniversaryShareService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AnniversaryShareRepository shareRepository;
    private final FriendRepository friendRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir.anniv:images/anniv}")
    private String annivDir;

    @Transactional
    public Map<String, Object> saveMine(Long userId, Map<String, Object> body) {
        AnniversaryShare a = shareRepository.findByUserId(userId).orElseGet(() -> {
            AnniversaryShare n = new AnniversaryShare();
            n.setUserId(userId);
            return n;
        });

        a.setPartnerName(cut(str(body.get("partnerName")), 50));
        a.setPartnerPhoto(cut(str(body.get("partnerPhoto")), 500));
        a.setRelationshipType(cut(str(body.get("relationshipType")), 20));
        a.setStartDate(cut(str(body.get("startDate")), 10));
        a.setMessage(cut(str(body.get("message")), 200));
        if (body.containsKey("shared")) a.setShared(!Boolean.FALSE.equals(body.get("shared")));

        Object colors = body.get("bgColors");
        if (colors instanceof List<?> list) {
            List<String> clean = new ArrayList<>();
            for (Object c : list) {
                String s = String.valueOf(c);
                if (s.matches("#[0-9A-Fa-f]{6,8}") || s.startsWith("rgba(")) clean.add(s);
            }
            a.setBgColors(cut(String.join(",", clean), 200));
        }

        try {
            a.setMembersJson(MAPPER.writeValueAsString(body.getOrDefault("members", List.of())));
        } catch (Exception e) {
            a.setMembersJson("[]");
        }

        // 배경 사진: data:image → 새로 저장 / /images/anniv/.. → 그대로 / 없으면 지우기
        if (body.containsKey("bgImage")) {
            String img = str(body.get("bgImage"));
            if (img == null || img.isBlank()) {
                deleteFile(a.getBgImagePath());
                a.setBgImagePath(null);
            } else if (img.startsWith("data:image")) {
                String old = a.getBgImagePath();
                a.setBgImagePath(saveImage(img));
                deleteFile(old);
            } else if (img.startsWith("/images/anniv/")) {
                a.setBgImagePath(img);
            }
        }

        shareRepository.save(a);
        return toMap(a, null);
    }

    public Map<String, Object> getMine(Long userId) {
        return shareRepository.findByUserId(userId).map(a -> toMap(a, null)).orElse(null);
    }

    public Map<String, Object> getFriend(Long viewerId, Long ownerId) {
        if (!viewerId.equals(ownerId) && !friendRepository.existsByUserIdAndLinkedUserId(ownerId, viewerId)) {
            throw new IllegalArgumentException("서로 연결된 친구의 기념일만 볼 수 있어요.");
        }
        AnniversaryShare a = shareRepository.findByUserId(ownerId)
                .filter(x -> x.isShared() || viewerId.equals(ownerId))
                .orElseThrow(() -> new IllegalArgumentException("아직 보여 줄 기념일이 없어요."));
        User owner = userRepository.findById(ownerId).orElse(null);
        return toMap(a, owner);
    }

    private Map<String, Object> toMap(AnniversaryShare a, User owner) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", a.getUserId());
        if (owner != null) {
            m.put("ownerName", owner.getName());
            m.put("ownerPhoto", owner.getProfileImage());
        }
        m.put("partnerName", a.getPartnerName());
        m.put("partnerPhoto", a.getPartnerPhoto());
        m.put("relationshipType", a.getRelationshipType());
        m.put("startDate", a.getStartDate());
        m.put("message", a.getMessage());
        m.put("bgColors", a.getBgColors() == null || a.getBgColors().isBlank()
                ? List.of() : List.of(a.getBgColors().split(",")));
        m.put("bgImage", a.getBgImagePath());
        List<Map<String, Object>> members;
        try {
            members = a.getMembersJson() == null ? List.of()
                    : MAPPER.readValue(a.getMembersJson(), new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            members = List.of();
        }
        m.put("members", members);
        m.put("shared", a.isShared());
        m.put("updatedAt", a.getUpdatedAt() == null ? null : a.getUpdatedAt().toString());
        return m;
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static String cut(String s, int max) {
        return s == null ? null : (s.length() > max ? s.substring(0, max) : s);
    }

    private String saveImage(String dataUrl) {
        String[] parts = dataUrl.split(",", 2);
        if (parts.length < 2) throw new IllegalArgumentException("사진 형식이 올바르지 않아요.");
        String ext = parts[0].contains("png") ? ".png" : ".jpg";
        try {
            byte[] bytes = Base64.getMimeDecoder().decode(parts[1]);
            if (bytes.length > 8 * 1024 * 1024) throw new IllegalArgumentException("배경 사진이 너무 커요. (8MB까지)");
            Path dir = Paths.get(annivDir);
            if (!Files.exists(dir)) Files.createDirectories(dir);
            String name = UUID.randomUUID() + ext;
            try (FileOutputStream fos = new FileOutputStream(dir.resolve(name).toFile())) {
                fos.write(bytes);
            }
            return "/images/anniv/" + name;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("배경 사진을 저장하지 못했어요: " + e.getMessage(), e);
        }
    }

    private void deleteFile(String path) {
        if (path == null || !path.startsWith("/images/anniv/")) return;
        try {
            Files.deleteIfExists(Paths.get(annivDir).resolve(path.substring("/images/anniv/".length())));
        } catch (Exception ignored) {
        }
    }
}
