package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.IncidentGeneralTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface IncidentGeneralTagRepository extends JpaRepository<IncidentGeneralTag, String> {

    Optional<IncidentGeneralTag> findByName(String name);

    @Query("SELECT t FROM IncidentGeneralTag t WHERE t.name IN :names")
    Set<IncidentGeneralTag> findAllByNameIn(@Param("names") Set<String> names);
}
