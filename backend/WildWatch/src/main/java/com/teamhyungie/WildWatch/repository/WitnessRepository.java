package com.teamhyungie.WildWatch.repository;

import com.teamhyungie.WildWatch.model.Witness;
import com.teamhyungie.WildWatch.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WitnessRepository extends JpaRepository<Witness, String> {
    List<Witness> findByIncident(Incident incident);
} 