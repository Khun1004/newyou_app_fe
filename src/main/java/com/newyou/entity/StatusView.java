package com.newyou.entity;

import java.time.LocalDateTime;

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

/** 👀 누가 어떤 상태를 봤는지 (본 상태는 동그라미 색이 옅어져요) */
@Entity
@Table(name = "status_views", uniqueConstraints = {
        @UniqueConstraint(name = "uk_status_viewer", columnNames = { "statusId", "viewerId" })
})
@Getter
@Setter
@NoArgsConstructor
public class StatusView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long statusId;

    @Column(nullable = false)
    private Long viewerId;

    @Column(nullable = false)
    private LocalDateTime viewedAt;

    public StatusView(Long statusId, Long viewerId) {
        this.statusId = statusId;
        this.viewerId = viewerId;
        this.viewedAt = LocalDateTime.now();
    }
}
