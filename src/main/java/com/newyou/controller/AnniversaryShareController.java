package com.newyou.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.newyou.entity.User;
import com.newyou.service.AnniversaryShareService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 💝 기념일 함께 보기
 *  PUT /api/anniversary/mine              내 기본 기념일 저장 (배경·메시지·함께하는 사람)
 *  GET /api/anniversary/mine              내가 저장한 것
 *  GET /api/anniversary/friend/{userId}   연결된 친구의 기념일 보기
 */
@Slf4j
@RestController
@RequestMapping("/api/anniversary")
@RequiredArgsConstructor
public class AnniversaryShareController {

    private final AnniversaryShareService service;

    @PutMapping("/mine")
    public ResponseEntity<?> saveMine(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            return ResponseEntity.ok(service.saveMine(user.getId(), body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 기념일 저장 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "기념일 저장 중 서버 오류: " + e.getMessage()));
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMine(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Map<String, Object> m = service.getMine(user.getId());
        return m == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(m);
    }

    @GetMapping("/friend/{userId}")
    public ResponseEntity<?> getFriend(@AuthenticationPrincipal User user, @PathVariable Long userId) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            return ResponseEntity.ok(service.getFriend(user.getId(), userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }
}
