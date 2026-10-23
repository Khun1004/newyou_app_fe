package com.newyou.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.newyou.entity.StatusView;

@Repository
public interface StatusViewRepository extends JpaRepository<StatusView, Long> {

    boolean existsByStatusIdAndViewerId(Long statusId, Long viewerId);

    List<StatusView> findByViewerIdAndStatusIdIn(Long viewerId, Collection<Long> statusIds);

    List<StatusView> findByStatusIdOrderByViewedAtDesc(Long statusId);

    List<StatusView> findByStatusIdIn(Collection<Long> statusIds);

    @Transactional
    void deleteByStatusId(Long statusId);
}
