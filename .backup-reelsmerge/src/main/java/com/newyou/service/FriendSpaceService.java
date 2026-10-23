package com.newyou.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.newyou.dto.ScheduleResponse;
import com.newyou.entity.Gift;
import com.newyou.entity.Reel;
import com.newyou.entity.ReelLike;
import com.newyou.entity.User;
import com.newyou.repository.FriendRepository;
import com.newyou.repository.GiftRepository;
import com.newyou.repository.ReelLikeRepository;
import com.newyou.repository.ReelRepository;
import com.newyou.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * 💞 우리 둘의 공간 (친구 한 명과 주고받는 것들)
 *
 * 볼 수 있는 규칙
 *  - 친구의 시간표·릴스: 친구가 나를 아이디로 연결했을 때 (상태 규칙과 같아요)
 *  - 선물 보내기: 서로 연결했을 때
 */
@Service
@RequiredArgsConstructor
public class FriendSpaceService {

    private final FriendRepository friendRepository;
    private final UserRepository userRepository;
    private final TimetableScheduleService timetableScheduleService;
    private final GiftRepository giftRepository;
    private final ReelRepository reelRepository;
    private final ReelLikeRepository reelLikeRepository;

    @Value("${file.upload-dir.reels:images/reels}")
    private String reelsDir;

    // =======================================================================
    // 연결 확인
    // =======================================================================

    /** owner 가 viewer 를 연결해 두었는지 (= viewer 가 owner 의 것을 볼 수 있는지) */
    public boolean canView(Long viewerId, Long ownerId) {
        return viewerId.equals(ownerId) || friendRepository.existsByUserIdAndLinkedUserId(ownerId, viewerId);
    }

    public boolean isMutual(Long a, Long b) {
        return friendRepository.existsByUserIdAndLinkedUserId(a, b) && friendRepository.existsByUserIdAndLinkedUserId(b, a);
    }

    private void requireView(Long viewerId, Long ownerId) {
        if (!canView(viewerId, ownerId)) {
            throw new IllegalArgumentException("친구가 나를 아이디로 연결해야 볼 수 있어요.");
        }
    }

    public Map<String, Object> summary(Long viewerId, Long otherId) {
        User other = userRepository.findById(otherId)
                .orElseThrow(() -> new IllegalArgumentException("친구 계정을 찾을 수 없어요."));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", other.getId());
        m.put("name", other.getName());
        m.put("loginId", other.getLoginId());
        m.put("profileImage", other.getProfileImage());
        m.put("iLinked", friendRepository.existsByUserIdAndLinkedUserId(viewerId, otherId));
        m.put("theyLinked", friendRepository.existsByUserIdAndLinkedUserId(otherId, viewerId));
        m.put("mutual", isMutual(viewerId, otherId));
        m.put("unopenedGifts", giftRepository.findBetween(viewerId, otherId).stream()
                .filter(g -> g.getReceiverId().equals(viewerId) && "sent".equals(g.getStatus())).count());
        return m;
    }

    // =======================================================================
    // 📅 시간표
    // =======================================================================

    public List<ScheduleResponse> timetable(Long viewerId, Long ownerId) {
        requireView(viewerId, ownerId);
        return timetableScheduleService.getMySchedules(ownerId);
    }

    // =======================================================================
    // 🎁 선물
    // =======================================================================

    @Transactional
    public Map<String, Object> sendGift(Long senderId, Map<String, Object> body) {
        Long to = toLong(body.get("toUserId"));
        if (to == null || to.equals(senderId)) throw new IllegalArgumentException("선물 받을 친구를 골라 주세요.");
        if (!isMutual(senderId, to)) throw new IllegalArgumentException("서로 연결된 친구에게만 선물을 보낼 수 있어요.");
        String name = str(body.get("name"));
        if (name == null || name.isBlank()) throw new IllegalArgumentException("선물을 골라 주세요.");

        Gift g = new Gift();
        g.setSenderId(senderId);
        g.setReceiverId(to);
        g.setName(cut(name, 100));
        g.setBrand(cut(str(body.get("brand")), 50));
        g.setPrice(cut(str(body.get("price")), 30));
        g.setImage(cut(str(body.get("image")), 500));
        g.setMessage(cut(str(body.get("message")), 200));
        return giftMap(giftRepository.save(g), senderId);
    }

    public List<Map<String, Object>> giftsBetween(Long me, Long other) {
        return giftRepository.findBetween(me, other).stream().map(g -> giftMap(g, me)).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> openGift(Long me, Long giftId) {
        Gift g = giftRepository.findById(giftId).filter(x -> x.getReceiverId().equals(me))
                .orElseThrow(() -> new IllegalArgumentException("받은 선물이 아니에요."));
        if ("sent".equals(g.getStatus())) {
            g.setStatus("opened");
            g.setOpenedAt(LocalDateTime.now());
        }
        return giftMap(giftRepository.save(g), me);
    }

    @Transactional
    public Map<String, Object> thankGift(Long me, Long giftId, String text) {
        Gift g = giftRepository.findById(giftId).filter(x -> x.getReceiverId().equals(me))
                .orElseThrow(() -> new IllegalArgumentException("받은 선물이 아니에요."));
        g.setStatus("thanked");
        if (g.getOpenedAt() == null) g.setOpenedAt(LocalDateTime.now());
        g.setThanks(cut(text == null || text.isBlank() ? "고마워요! 💖" : text.trim(), 200));
        return giftMap(giftRepository.save(g), me);
    }

    private Map<String, Object> giftMap(Gift g, Long me) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", g.getId());
        m.put("mine", g.getSenderId().equals(me)); // 내가 보낸 선물인지
        m.put("name", g.getName());
        m.put("brand", g.getBrand());
        m.put("price", g.getPrice());
        m.put("image", g.getImage());
        m.put("message", g.getMessage());
        m.put("status", g.getStatus());
        m.put("thanks", g.getThanks());
        m.put("createdAt", g.getCreatedAt().toString());
        m.put("openedAt", g.getOpenedAt() == null ? null : g.getOpenedAt().toString());
        return m;
    }

    // =======================================================================
    // 🎬 릴스
    // =======================================================================

    @Transactional
    public Map<String, Object> uploadReel(Long userId, String title, MultipartFile video) {
        if (video == null || video.isEmpty()) throw new IllegalArgumentException("동영상을 골라 주세요.");
        String t = title == null || title.isBlank() ? "나의 릴스" : title.trim();
        String original = video.getOriginalFilename() == null ? "" : video.getOriginalFilename().toLowerCase();
        String ext = original.endsWith(".mov") ? ".mov" : original.endsWith(".m4v") ? ".m4v" : ".mp4";
        try {
            Path dir = Paths.get(reelsDir);
            if (!Files.exists(dir)) Files.createDirectories(dir);
            String name = UUID.randomUUID() + ext;
            Files.copy(video.getInputStream(), dir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            Reel r = new Reel();
            r.setUserId(userId);
            r.setTitle(cut(t, 100));
            r.setVideoPath("/images/reels/" + name);
            return reelMap(reelRepository.save(r), userId, 0, false);
        } catch (Exception e) {
            throw new RuntimeException("동영상을 저장하지 못했어요: " + e.getMessage(), e);
        }
    }

    public List<Map<String, Object>> reelsOf(Long viewerId, Long ownerId) {
        requireView(viewerId, ownerId);
        List<Reel> reels = reelRepository.findByUserIdOrderByCreatedAtDesc(ownerId);
        if (reels.isEmpty()) return List.of();
        List<ReelLike> likes = reelLikeRepository.findByReelIdIn(reels.stream().map(Reel::getId).collect(Collectors.toList()));
        Map<Long, Long> counts = likes.stream().collect(Collectors.groupingBy(ReelLike::getReelId, Collectors.counting()));
        Set<Long> mine = likes.stream().filter(l -> l.getUserId().equals(viewerId)).map(ReelLike::getReelId)
                .collect(Collectors.toSet());
        List<Map<String, Object>> out = new ArrayList<>();
        for (Reel r : reels) out.add(reelMap(r, viewerId, counts.getOrDefault(r.getId(), 0L), mine.contains(r.getId())));
        return out;
    }

    @Transactional
    public Map<String, Object> toggleLike(Long userId, Long reelId) {
        Reel r = reelRepository.findById(reelId).orElseThrow(() -> new IllegalArgumentException("릴스를 찾을 수 없어요."));
        requireView(userId, r.getUserId());
        var existing = reelLikeRepository.findByReelIdAndUserId(reelId, userId);
        boolean liked;
        if (existing.isPresent()) {
            reelLikeRepository.delete(existing.get());
            liked = false;
        } else {
            reelLikeRepository.save(new ReelLike(reelId, userId));
            liked = true;
        }
        long count = reelLikeRepository.findByReelIdIn(List.of(reelId)).size();
        return Map.of("liked", liked, "likes", count);
    }

    @Transactional
    public void deleteReel(Long userId, Long reelId) {
        Reel r = reelRepository.findById(reelId).filter(x -> x.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("내 릴스만 지울 수 있어요."));
        reelLikeRepository.deleteByReelId(reelId);
        try {
            Files.deleteIfExists(Paths.get(reelsDir).resolve(r.getVideoPath().substring("/images/reels/".length())));
        } catch (Exception ignored) {
        }
        reelRepository.delete(r);
    }

    private Map<String, Object> reelMap(Reel r, Long viewerId, long likes, boolean liked) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("userId", r.getUserId());
        m.put("title", r.getTitle());
        m.put("videoUrl", r.getVideoPath());
        m.put("likes", likes);
        m.put("liked", liked);
        m.put("mine", r.getUserId().equals(viewerId));
        m.put("createdAt", r.getCreatedAt().toString());
        return m;
    }

    // =======================================================================

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static String cut(String s, int max) {
        return s == null ? null : (s.length() > max ? s.substring(0, max) : s);
    }

    private static Long toLong(Object o) {
        if (o == null) return null;
        try {
            return Long.valueOf(String.valueOf(o));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
