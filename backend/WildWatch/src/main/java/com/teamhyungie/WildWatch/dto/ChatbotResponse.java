package com.teamhyungie.WildWatch.dto;

public class ChatbotResponse {
    private String reply;

    public ChatbotResponse() {}
    public ChatbotResponse(String reply) { this.reply = reply; }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
} 