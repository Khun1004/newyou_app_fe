package com.newyou.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.newyou.entity.AnniversaryShare;

@Repository
public interface AnniversaryShareRepository extends JpaRepository<AnniversaryShare, Long> {

    Optional<AnniversaryShare> findByUserId(Long userId);

    /** 보여주기를 켠 사람들 중에서 */
    List<AnniversaryShare> findByUserIdInAndSharedTrue(Collection<Long> userIds);
}
