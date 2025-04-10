package com.teamhyungie.WildWatch.security;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user = super.loadUser(userRequest);
        
        // Get the user's attributes
        Map<String, Object> attributes = user.getAttributes();
        
        // Microsoft Graph API returns email in 'mail' or 'userPrincipalName' field
        String email = (String) attributes.get("mail");
        if (email == null) {
            email = (String) attributes.get("userPrincipalName");
        }
        
        // Add email to attributes if not present
        if (email != null && !attributes.containsKey("email")) {
            attributes.put("email", email);
        }
        
        // Return the user with updated attributes
        return new DefaultOAuth2User(
            user.getAuthorities(),
            attributes,
            "email" // Use email as the name attribute key
        );
    }
} 