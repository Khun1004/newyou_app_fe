package com.newyou.service;

import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.newyou.entity.Friend;
import com.newyou.entity.Status;
import com.newyou.entity.StatusView;
import com.newyou.entity.User;
import com.newyou.repository.FriendRepository;
import com.newyou.repository.StatusRepository;
import com.newyou.repository.StatusViewRepository;
import com.newyou.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * 💬 상태(스토리) + 💞 친구·가족 연결
 *
 * 누가 볼 수 있나요?
 *  - 내가 친구 목록에서 '아이디로 연결'한 사람만 내 상태를 볼 수 있어요.
 *  - 반대로, 나를 연결해 둔 사람의 상태는 내 화면에 떠요.
 */
@Service
@RequiredArgsConstructor
public class StatusService {

    private static final int MAX_TEXT = 60;
    private static final int MAX_ACTIVE = 10;
    private static final Set<String> RELATIONS = Set.of("family", "friend", "lover", "spouse", "coworker");

    private final StatusRepository statusRepository;
    private final StatusViewRepository statusViewRepository;
    private final FriendRepository friendRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir.status:images/status}")
    private String statusDir;

    // =======================================================================
    // 💞 친구·가족 연결
    // =======================================================================

    /**
     * 친구의 관계를 정하고, New You 아이디로 계정을 연결해요.
     * loginId 가 비어 있으면 연결을 끊어요.
     */
    @Transactional
    public Friend connect(Long userId, Long friendId, String relation, String loginId) {
        Friend friend = friendRepository.findByUserIdAndId(userId, friendId)
                .orElseThrow(() -> new IllegalArgumentException("친구를 찾을 수 없어요."));

        if (relation == null || relation.isBlank()) {
            friend.setRelation(null);
        } else if (RELATIONS.contains(relation)) {
            friend.setRelation(relation);
        } else {
            throw new IllegalArgumentException("관계는 가족·친구·연인·배우자·동료 중에서 골라 주세요.");
        }

        if (loginId == null || loginId.isBlank()) {
            friend.setLinkedUserId(null);
            friend.setLinkedLoginId(null);
        } else {
            String id = loginId.trim().toLowerCase();
            User target = userRepository.findByLoginId(id)
                    .or(() -> userRepository.findByPhoneNumber(id.replaceAll("[^0-9]", "")))
                    .orElseThrow(() -> new IllegalArgumentException("'" + loginId + "' 아이디를 쓰는 사람이 없어요."));
            if (target.getId().equals(userId)) {
                throw new IllegalArgumentException("내 아이디는 연결할 수 없어요.");
            }
            friend.setLinkedUserId(target.getId());
            friend.setLinkedLoginId(target.getLoginId() != null ? target.getLoginId() : id);
        }
        return friendRepository.save(friend);
    }

    // =======================================================================
    // 💬 상태 올리기 / 지우기
    // =======================================================================

    @Transactional
    public Status create(Long userId, String imageDataUrl, String text, String bgColor) {
        String cleanText = text == null ? "" : text.trim();
        boolean hasImage = imageDataUrl != null && !imageDataUrl.isBlank();
        if (!hasImage && cleanText.isEmpty()) {
            throw new IllegalArgumentException("사진이나 한마디 중 하나는 넣어 주세요.");
        }
        if (cleanText.length() > MAX_TEXT) {
            throw new IllegalArgumentException("한마디는 " + MAX_TEXT + "자까지 쓸 수 있어요.");
        }
        if (statusRepository.countByUserIdAndExpiresAtAfter(userId, LocalDateTime.now()) >= MAX_ACTIVE) {
            throw new IllegalArgumentException("상태는 하루에 " + MAX_ACTIVE + "개까지 올릴 수 있어요.");
        }

        Status status = new Status();
        status.setUserId(userId);
        status.setText(cleanText.isEmpty() ? null : cleanText);
        status.setBgColor(bgColor != null && bgColor.matches("#[0-9A-Fa-f]{6}") ? bgColor : "#4E7D32");
        if (hasImage) {
            status.setImagePath(saveImage(imageDataUrl));
        }
        return statusRepository.save(status);
    }

    @Transactional
    public void delete(Long userId, Long statusId) {
        Status status = statusRepository.findById(statusId)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("상태를 찾을 수 없어요."));
        statusViewRepository.deleteByStatusId(statusId);
        deleteImageFile(status.getImagePath());
        statusRepository.delete(status);
    }

    // =======================================================================
    // 👀 보기
    // =======================================================================

    /** viewer 가 이 상태를 볼 수 있는지: 내 것이거나, 올린 사람이 나를 연결해 두었을 때 */
    private boolean canSee(Long viewerId, Status status) {
        return status.getUserId().equals(viewerId)
                || friendRepository.existsByUserIdAndLinkedUserId(status.getUserId(), viewerId);
    }

    @Transactional
    public void markViewed(Long viewerId, Long statusId) {
        Status status = statusRepository.findById(statusId)
                .orElseThrow(() -> new IllegalArgumentException("상태를 찾을 수 없어요."));
        if (!canSee(viewerId, status)) {
            throw new IllegalArgumentException("볼 수 없는 상태예요.");
        }
        if (status.getUserId().equals(viewerId)) return; // 내 것은 기록하지 않아요
        if (!statusViewRepository.existsByStatusIdAndViewerId(statusId, viewerId)) {
            statusViewRepository.save(new StatusView(statusId, viewerId));
        }
    }

    /** 내 상태를 본 사람들 */
    public List<Map<String, Object>> viewers(Long userId, Long statusId) {
        Status status = statusRepository.findById(statusId)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("상태를 찾을 수 없어요."));
        List<StatusView> views = statusViewRepository.findByStatusIdOrderByViewedAtDesc(status.getId());
        Map<Long, User> users = userRepository.findAllById(
                views.stream().map(StatusView::getViewerId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(User::getId, u -> u));
        List<Map<String, Object>> out = new ArrayList<>();
        for (StatusView v : views) {
            User u = users.get(v.getViewerId());
            if (u == null) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", u.getId());
            m.put("name", u.getName());
            m.put("profileImage", u.getProfileImage());
            m.put("viewedAt", v.getViewedAt().toString());
            out.add(m);
        }
        return out;
    }

    /** 추억 보관함 (24시간이 지난 내 상태) */
    public List<Map<String, Object>> archive(Long userId) {
        return statusRepository.findTop60ByUserIdAndExpiresAtBeforeOrderByCreatedAtDesc(userId, LocalDateTime.now())
                .stream().map(s -> toMap(s, true, 0)).collect(Collectors.toList());
    }

    // =======================================================================
    // 🌈 피드: 동그라미 줄에 보여줄 사람들
    // =======================================================================

    public Map<String, Object> feed(User me) {
        LocalDateTime now = LocalDateTime.now();
        Long myId = me.getId();

        // 1) 내 친구 목록 (생일 화면에 등록한 친구들)
        List<Friend> myFriends = friendRepository.findByUserId(myId);

        // 2) 나를 연결해 둔 사람들 = 내가 상태를 볼 수 있는 사람들
        Set<Long> canSeeOwners = friendRepository.findByLinkedUserId(myId).stream()
                .map(Friend::getUserId).collect(Collectors.toCollection(LinkedHashSet::new));

        // 3) 상태 한 번에 불러오기 (나 + 볼 수 있는 사람들)
        Set<Long> owners = new HashSet<>(canSeeOwners);
        owners.add(myId);
        List<Status> active = statusRepository.findByUserIdInAndExpiresAtAfterOrderByCreatedAtAsc(owners, now);
        Map<Long, List<Status>> byOwner = active.stream().collect(Collectors.groupingBy(Status::getUserId));

        // 내가 이미 본 상태
        Set<Long> seen = active.isEmpty() ? Set.of()
                : statusViewRepository.findByViewerIdAndStatusIdIn(myId,
                        active.stream().map(Status::getId).collect(Collectors.toList()))
                        .stream().map(StatusView::getStatusId).collect(Collectors.toSet());

        // 내 상태를 본 사람 수
        List<Status> mine = byOwner.getOrDefault(myId, List.of());
        Map<Long, Long> viewCounts = mine.isEmpty() ? Map.of()
                : statusViewRepository.findByStatusIdIn(mine.stream().map(Status::getId).collect(Collectors.toList()))
                        .stream().collect(Collectors.groupingBy(StatusView::getStatusId, Collectors.counting()));

        Map<String, Object> meMap = new LinkedHashMap<>();
        meMap.put("userId", myId);
        meMap.put("name", me.getName());
        meMap.put("loginId", me.getLoginId());
        meMap.put("profileImage", me.getProfileImage());
        meMap.put("statuses", mine.stream()
                .map(s -> toMap(s, true, viewCounts.getOrDefault(s.getId(), 0L))).collect(Collectors.toList()));

        // 4) 사람 목록 만들기
        Map<Long, User> linkedUsers = new HashMap<>();
        Set<Long> userIds = new HashSet<>(canSeeOwners);
        myFriends.stream().map(Friend::getLinkedUserId).filter(id -> id != null).forEach(userIds::add);
        userRepository.findAllById(userIds).forEach(u -> linkedUsers.put(u.getId(), u));

        List<Map<String, Object>> people = new ArrayList<>();
        Set<Long> shownUsers = new HashSet<>();
        for (Friend f : myFriends) {
            Long linked = f.getLinkedUserId();
            List<Status> statuses = (linked != null && canSeeOwners.contains(linked))
                    ? byOwner.getOrDefault(linked, List.of()) : List.of();
            if (linked != null) shownUsers.add(linked);
            people.add(person(String.valueOf(f.getId()), f.getId(), linked, f.getNickname(), f.getRelation(),
                    f.getProfileImage(), linked != null ? Optional.ofNullable(linkedUsers.get(linked)) : Optional.<User>empty(),
                    f.getLinkedLoginId(), linked != null && canSeeOwners.contains(linked), statuses, seen));
        }
        // 나를 연결했지만 내 친구 목록에는 없는 사람도 보여줘요
        for (Long ownerId : canSeeOwners) {
            if (shownUsers.contains(ownerId)) continue;
            User u = linkedUsers.get(ownerId);
            if (u == null) continue;
            people.add(person("u" + ownerId, null, ownerId, u.getName(), null, null, Optional.of(u),
                    u.getLoginId(), true, byOwner.getOrDefault(ownerId, List.of()), seen));
        }

        // 안 본 상태가 있는 사람 → 본 상태가 있는 사람 → 나머지 (이름순)
        people.sort(Comparator
                .comparingInt((Map<String, Object> p) -> rank(p))
                .thenComparing(p -> String.valueOf(p.get("name"))));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("me", meMap);
        out.put("people", people);
        return out;
    }

    private static int rank(Map<String, Object> p) {
        if (Boolean.TRUE.equals(p.get("hasUnseen"))) return 0;
        if (Boolean.TRUE.equals(p.get("hasStatus"))) return 1;
        return 2;
    }

    private Map<String, Object> person(String key, Long friendId, Long userId, String name, String relation,
            String friendPhoto, Optional<User> linkedUser, String linkedLoginId, boolean mutual,
            List<Status> statuses, Set<Long> seen) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("key", key);
        p.put("friendId", friendId != null ? String.valueOf(friendId) : null);
        p.put("userId", userId);
        p.put("name", name);
        p.put("relation", relation);
        // 사진: 친구 목록 사진 → 연결된 계정의 프로필 사진
        String photo = friendPhoto;
        if ((photo == null || photo.isBlank()) && linkedUser.isPresent()) photo = linkedUser.get().getProfileImage();
        p.put("photo", photo);
        p.put("linked", userId != null);
        p.put("linkedLoginId", linkedLoginId);
        p.put("canSeeStatus", mutual); // 상대도 나를 연결했는지 (상대 상태를 볼 수 있는지)
        List<Map<String, Object>> list = statuses.stream()
                .map(s -> {
                    Map<String, Object> m = toMap(s, false, 0);
                    m.put("seen", seen.contains(s.getId()));
                    return m;
                }).collect(Collectors.toList());
        p.put("statuses", list);
        p.put("hasStatus", !list.isEmpty());
        p.put("hasUnseen", list.stream().anyMatch(m -> !Boolean.TRUE.equals(m.get("seen"))));
        return p;
    }

    private Map<String, Object> toMap(Status s, boolean mine, long viewCount) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("imageUrl", s.getImagePath());
        m.put("text", s.getText());
        m.put("bgColor", s.getBgColor());
        m.put("createdAt", s.getCreatedAt().toString());
        m.put("expiresAt", s.getExpiresAt().toString());
        if (mine) m.put("viewCount", viewCount);
        return m;
    }

    // =======================================================================
    // 🖼️ 사진 저장 (data:image/jpeg;base64,.... → images/status/UUID.jpg)
    // =======================================================================

    private String saveImage(String dataUrl) {
        String[] parts = dataUrl.split(",", 2);
        if (parts.length < 2 || !parts[0].startsWith("data:image")) {
            throw new IllegalArgumentException("사진 형식이 올바르지 않아요.");
        }
        String ext = parts[0].contains("png") ? ".png" : parts[0].contains("gif") ? ".gif" : ".jpg";
        try {
            byte[] bytes = Base64.getDecoder().decode(parts[1]);
            if (bytes.length > 8 * 1024 * 1024) {
                throw new IllegalArgumentException("사진이 너무 커요. (8MB까지)");
            }
            Path dir = Paths.get(statusDir);
            if (!Files.exists(dir)) Files.createDirectories(dir);
            String fileName = UUID.randomUUID() + ext;
            try (FileOutputStream fos = new FileOutputStream(dir.resolve(fileName).toFile())) {
                fos.write(bytes);
            }
            return "/images/status/" + fileName;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("사진을 저장하지 못했어요.", e);
        }
    }

    private void deleteImageFile(String imagePath) {
        if (imagePath == null || !imagePath.startsWith("/images/status/")) return;
        try {
            Files.deleteIfExists(Paths.get(statusDir).resolve(imagePath.substring("/images/status/".length())));
        } catch (Exception ignored) {
            // 파일이 없어도 괜찮아요
        }
    }
}
