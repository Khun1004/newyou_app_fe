package com.newyou.controller;

import java.util.Map;

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
import org.springframework.web.bind.annotation.RestController;

import com.newyou.entity.Friend;
import com.newyou.entity.User;
import com.newyou.service.StatusService;

import lombok.RequiredArgsConstructor;

/**
 * 💬 상태(스토리) API + 💞 친구 연결 API
 *
 *  GET    /api/status/feed               동그라미 줄 (나 + 친구·가족 + 상태)
 *  POST   /api/status                    상태 올리기 { image(data URL, 선택), text, bgColor }
 *  DELETE /api/status/{id}               내 상태 지우기
 *  POST   /api/status/{id}/view          봤어요 표시
 *  GET    /api/status/{id}/viewers       내 상태를 본 사람들
 *  GET    /api/status/archive            추억 보관함 (24시간 지난 내 상태)
 *  PUT    /api/friends/{friendId}/connect  관계 정하기 + 아이디로 연결 { relation, loginId }
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatusController {

    private final StatusService statusService;

    private static ResponseEntity<?> bad(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    private static ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요해요."));
    }

    @GetMapping("/status/feed")
    public ResponseEntity<?> feed(@AuthenticationPrincipal User user) {
        if (user == null) return unauthorized();
        return ResponseEntity.ok(statusService.feed(user));
    }

    @PostMapping("/status")
    public ResponseEntity<?> create(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        if (user == null) return unauthorized();
        try {
            var s = statusService.create(user.getId(), body.get("image"), body.get("text"), body.get("bgColor"));
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", s.getId(), "message", "상태를 올렸어요."));
        } catch (IllegalArgumentException e) {
            return bad(e);
        }
    }

    @DeleteMapping("/status/{statusId}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal User user, @PathVariable Long statusId) {
        if (user == null) return unauthorized();
        try {
            statusService.delete(user.getId(), statusId);
            return ResponseEntity.ok(Map.of("message", "상태를 지웠어요."));
        } catch (IllegalArgumentException e) {
            return bad(e);
        }
    }

    @PostMapping("/status/{statusId}/view")
    public ResponseEntity<?> view(@AuthenticationPrincipal User user, @PathVariable Long statusId) {
        if (user == null) return unauthorized();
        try {
            statusService.markViewed(user.getId(), statusId);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return bad(e);
        }
    }

    @GetMapping("/status/{statusId}/viewers")
    public ResponseEntity<?> viewers(@AuthenticationPrincipal User user, @PathVariable Long statusId) {
        if (user == null) return unauthorized();
        try {
            return ResponseEntity.ok(statusService.viewers(user.getId(), statusId));
        } catch (IllegalArgumentException e) {
            return bad(e);
        }
    }

    @GetMapping("/status/archive")
    public ResponseEntity<?> archive(@AuthenticationPrincipal User user) {
        if (user == null) return unauthorized();
        return ResponseEntity.ok(statusService.archive(user.getId()));
    }

    @PutMapping("/friends/{friendId}/connect")
    public ResponseEntity<?> connect(@AuthenticationPrincipal User user, @PathVariable Long friendId,
            @RequestBody Map<String, String> body) {
        if (user == null) return unauthorized();
        try {
            Friend f = statusService.connect(user.getId(), friendId, body.get("relation"), body.get("loginId"));
            return ResponseEntity.ok(Map.of(
                    "id", String.valueOf(f.getId()),
                    "relation", f.getRelation() == null ? "" : f.getRelation(),
                    "linkedLoginId", f.getLinkedLoginId() == null ? "" : f.getLinkedLoginId(),
                    "message", "연결했어요."));
        } catch (IllegalArgumentException e) {
            return bad(e);
        }
    }
}
