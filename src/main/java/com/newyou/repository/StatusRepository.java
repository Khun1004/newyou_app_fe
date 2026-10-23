package com.newyou.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.newyou.entity.Status;

@Repository
public interface StatusRepository extends JpaRepository<Status, Long> {

    /** 지금 보이는(24시간 안 지난) 상태들 */
    List<Status> findByUserIdInAndExpiresAtAfterOrderByCreatedAtAsc(Collection<Long> userIds, LocalDateTime now);

    long countByUserIdAndExpiresAtAfter(Long userId, LocalDateTime now);

    /** 추억 보관함: 시간이 지난 내 상태들 */
    List<Status> findTop60ByUserIdAndExpiresAtBeforeOrderByCreatedAtDesc(Long userId, LocalDateTime now);
}
