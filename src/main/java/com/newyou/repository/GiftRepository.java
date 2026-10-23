package com.newyou.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.newyou.entity.Gift;

@Repository
public interface GiftRepository extends JpaRepository<Gift, Long> {

    /** 두 사람이 주고받은 선물 (최신 순) */
    @Query("select g from Gift g where (g.senderId = :a and g.receiverId = :b) or (g.senderId = :b and g.receiverId = :a) order by g.createdAt desc")
    List<Gift> findBetween(@Param("a") Long a, @Param("b") Long b);

    long countByReceiverIdAndStatus(Long receiverId, String status);
}
