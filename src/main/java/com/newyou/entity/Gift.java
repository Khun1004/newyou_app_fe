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

/** 🎁 친구끼리 주고받은 선물 */
@Entity
@Table(name = "gifts", indexes = {
        @Index(name = "idx_gift_pair", columnList = "senderId, receiverId")
})
@Getter
@Setter
@NoArgsConstructor
public class Gift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false)
    private Long receiverId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String brand;

    @Column(length = 30)
    private String price;

    @Column(length = 500)
    private String image;

    /** 함께 보내는 한마디 */
    @Column(length = 200)
    private String message;

    /** sent 보냄 → opened 열어 봄 → thanked 고마워요 */
    @Column(nullable = false, length = 10)
    private String status = "sent";

    /** 받은 사람의 고마워요 한마디 */
    @Column(length = 200)
    private String thanks;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime openedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
