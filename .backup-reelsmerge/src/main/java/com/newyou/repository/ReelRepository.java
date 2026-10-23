package com.newyou.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.newyou.entity.Reel;

@Repository
public interface ReelRepository extends JpaRepository<Reel, Long> {
    List<Reel> findByUserIdOrderByCreatedAtDesc(Long userId);
}
