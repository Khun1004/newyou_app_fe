package com.newyou.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** ❤️ 릴스 좋아요 */
@Entity
@Table(name = "reel_likes", uniqueConstraints = {
        @UniqueConstraint(name = "uk_reel_like", columnNames = { "reelId", "userId" })
})
@Getter
@Setter
@NoArgsConstructor
public class ReelLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long reelId;

    @Column(nullable = false)
    private Long userId;

    public ReelLike(Long reelId, Long userId) {
        this.reelId = reelId;
        this.userId = userId;
    }
}
