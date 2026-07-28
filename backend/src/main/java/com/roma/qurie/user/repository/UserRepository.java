package com.roma.qurie.user.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roma.qurie.user.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	boolean existsByEmail(String email);
	List<User> findByEmail(String email);
}
