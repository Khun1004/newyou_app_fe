package com.newyou.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 💝 친구에게 보여주는 '우리의 특별한 날' (기본 기념일 한 개)
 * 휴대폰에 저장된 기념일을 서버에도 올려 두면, 서로 연결된 친구가 볼 수 있어요.
 */
@Entity
@Table(name = "anniversary_shares")
@Getter
@Setter
@NoArgsConstructor
public class AnniversaryShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 주인 (한 사람에 한 개) */
    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(length = 50)
    private String partnerName;

    @Column(length = 500)
    private String partnerPhoto;

    /** relationship 연인 / married 부부 / friendship 친구 */
    @Column(length = 20)
    private String relationshipType;

    /** yyyy-MM-dd */
    @Column(length = 10)
    private String startDate;

    @Column(length = 200)
    private String message;

    /** 배경색 (#AAAAAA,#BBBBBB,...) */
    @Column(length = 200)
    private String bgColors;

    /** 배경 사진 (/images/anniv/파일이름) */
    @Column(length = 255)
    private String bgImagePath;

    /** 함께하는 사람들 [{"name":"..","photo":".."}] */
    @Column(columnDefinition = "TEXT")
    private String membersJson;

    /** 친구에게 보여줄지 */
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean shared = true;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}
