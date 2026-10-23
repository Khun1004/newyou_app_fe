package com.newyou.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 💬 상태(스토리) — 메신저처럼 사진이나 한마디를 올려요.
 * 24시간이 지나면 친구들에게 보이지 않고 '추억 보관함'에만 남아요.
 */
@Entity
@Table(name = "statuses", indexes = {
        @Index(name = "idx_status_user_expires", columnList = "userId, expiresAt")
})
@Getter
@Setter
@NoArgsConstructor
public class Status {

    public static final int HOURS_VISIBLE = 24;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 올린 사람 */
    @Column(nullable = false)
    private Long userId;

    /** 사진 경로 (/images/status/파일이름), 글만 올리면 null */
    @Column(length = 255)
    private String imagePath;

    /** 한마디 (60자까지) */
    @Column(length = 100)
    private String text;

    /** 글만 올릴 때 배경색 (#RRGGBB) */
    @Column(length = 20)
    private String bgColor;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (expiresAt == null) expiresAt = createdAt.plusHours(HOURS_VISIBLE);
    }
}
