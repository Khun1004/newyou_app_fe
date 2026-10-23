package com.newyou.controller;

import java.util.Map;
import java.util.function.Supplier;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.newyou.entity.User;
import com.newyou.service.FriendSpaceService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 💞 우리 둘의 공간 API
 *
 *  GET    /api/space/{userId}                 친구 정보 + 연결 상태
 *  GET    /api/space/{userId}/timetable       친구 시간표
 *
 *  POST   /api/gifts                          선물 보내기 { toUserId, name, brand, price, image, message }
 *  GET    /api/gifts/with/{userId}            둘이 주고받은 선물
 *  POST   /api/gifts/{id}/open                받은 선물 열기
 *  POST   /api/gifts/{id}/thanks              고마워요 { message }
 *
 *  POST   /api/reels                          릴스 올리기 (multipart: video, title)
 *  GET    /api/reels/feed                     피드 (내 릴스 + 나를 연결한 친구들)
 *  PUT    /api/reels/{id}/hide                숨기기 / 다시 보이기
 *  GET    /api/reels/user/{userId}            친구(또는 내) 릴스
 *  POST   /api/reels/{id}/like                좋아요 / 취소
 *  DELETE /api/reels/{id}                     내 릴스 지우기
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FriendSpaceController {

    private final FriendSpaceService service;

    private ResponseEntity<?> run(User user, Supplier<Object> work) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요해요."));
        }
        try {
            Object result = work.get();
            return result == null ? ResponseEntity.ok(Map.of("ok", true)) : ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 우리 둘의 공간 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "서버 오류: " + e.getMessage()));
        }
    }

    // ---------------- 친구 정보 · 시간표 ----------------

    @GetMapping("/space/{userId}")
    public ResponseEntity<?> summary(@AuthenticationPrincipal User user, @PathVariable Long userId) {
        return run(user, () -> service.summary(user.getId(), userId));
    }

    @GetMapping("/space/{userId}/timetable")
    public ResponseEntity<?> timetable(@AuthenticationPrincipal User user, @PathVariable Long userId) {
        return run(user, () -> service.timetable(user.getId(), userId));
    }

    // ---------------- 선물 ----------------

    @PostMapping("/gifts")
    public ResponseEntity<?> sendGift(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> service.sendGift(user.getId(), body));
    }

    @GetMapping("/gifts/with/{userId}")
    public ResponseEntity<?> gifts(@AuthenticationPrincipal User user, @PathVariable Long userId) {
        return run(user, () -> service.giftsBetween(user.getId(), userId));
    }

    @PostMapping("/gifts/{giftId}/open")
    public ResponseEntity<?> open(@AuthenticationPrincipal User user, @PathVariable Long giftId) {
        return run(user, () -> service.openGift(user.getId(), giftId));
    }

    @PostMapping("/gifts/{giftId}/thanks")
    public ResponseEntity<?> thanks(@AuthenticationPrincipal User user, @PathVariable Long giftId,
            @RequestBody(required = false) Map<String, String> body) {
        return run(user, () -> service.thankGift(user.getId(), giftId, body == null ? null : body.get("message")));
    }

    // ---------------- 릴스 ----------------

    @PostMapping("/reels")
    public ResponseEntity<?> uploadReel(@AuthenticationPrincipal User user,
            @RequestParam("video") MultipartFile video,
            @RequestParam(value = "title", required = false) String title) {
        return run(user, () -> service.uploadReel(user.getId(), title, video));
    }

    /** 🎬 릴스 피드 (내 릴스 + 나를 연결한 친구들 릴스) */
    @GetMapping("/reels/feed")
    public ResponseEntity<?> reelFeed(@AuthenticationPrincipal User user) {
        return run(user, () -> service.feed(user.getId()));
    }

    /** 숨기기 / 다시 보이기 */
    @PutMapping("/reels/{reelId}/hide")
    public ResponseEntity<?> hideReel(@AuthenticationPrincipal User user, @PathVariable Long reelId) {
        return run(user, () -> service.toggleHidden(user.getId(), reelId));
    }

    @GetMapping("/reels/user/{userId}")
    public ResponseEntity<?> reels(@AuthenticationPrincipal User user, @PathVariable Long userId) {
        return run(user, () -> service.reelsOf(user.getId(), userId));
    }

    @PostMapping("/reels/{reelId}/like")
    public ResponseEntity<?> like(@AuthenticationPrincipal User user, @PathVariable Long reelId) {
        return run(user, () -> service.toggleLike(user.getId(), reelId));
    }

    @DeleteMapping("/reels/{reelId}")
    public ResponseEntity<?> deleteReel(@AuthenticationPrincipal User user, @PathVariable Long reelId) {
        return run(user, () -> {
            service.deleteReel(user.getId(), reelId);
            return null;
        });
    }
}
