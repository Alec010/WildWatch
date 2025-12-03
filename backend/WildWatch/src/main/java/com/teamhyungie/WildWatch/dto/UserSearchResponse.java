package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for returning user search results
 * Contains minimal user information needed for @mention functionality
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String schoolIdNumber;
    
    /**
     * Factory method to create a UserSearchResponse from a User entity
     * @param user The user entity
     * @return UserSearchResponse DTO with required fields
     */
    public static UserSearchResponse fromUser(User user) {
        return UserSearchResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .schoolIdNumber(user.getSchoolIdNumber())
                .build();
    }
}
