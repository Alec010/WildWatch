package com.teamhyungie.WildWatch.dto;

import com.teamhyungie.WildWatch.model.User;
import com.teamhyungie.WildWatch.model.Role;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String middleInitial;
    private String email;
    private String schoolIdNumber;
    private String contactNumber;
    private Role role;

    public static UserResponse fromUser(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setMiddleInitial(user.getMiddleInitial());
        response.setEmail(user.getEmail());
        response.setSchoolIdNumber(user.getSchoolIdNumber());
        response.setContactNumber(user.getContactNumber());
        response.setRole(user.getRole());
        return response;
    }
} 