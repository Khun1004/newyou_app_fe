package com.newyou.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.newyou.entity.ReelLike;

@Repository
public interface ReelLikeRepository extends JpaRepository<ReelLike, Long> {
    Optional<ReelLike> findByReelIdAndUserId(Long reelId, Long userId);

    List<ReelLike> findByReelIdIn(Collection<Long> reelIds);

    @Transactional
    void deleteByReelId(Long reelId);
}
