package com.teamhyungie.WildWatch.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

@RestController
public class FileDebugController {
    private final Logger logger = LoggerFactory.getLogger(FileDebugController.class);

    @GetMapping("/api/debug/file-info")
    public Map<String, Object> getFileInfo() {
        Map<String, Object> info = new HashMap<>();
        
        // Get the current working directory (WildWatch)
        File currentDir = new File(System.getProperty("user.dir"));
        // The uploads directory is at the same level
        File uploadsDir = new File(currentDir, "uploads");
        
        info.put("currentDir", currentDir.getAbsolutePath());
        info.put("uploadsPath", uploadsDir.getAbsolutePath());
        info.put("uploadsExists", uploadsDir.exists());
        info.put("uploadsIsDirectory", uploadsDir.isDirectory());
        
        if (uploadsDir.exists() && uploadsDir.isDirectory()) {
            File[] files = uploadsDir.listFiles();
            if (files != null) {
                info.put("fileCount", files.length);
                info.put("files", java.util.Arrays.stream(files)
                    .map(file -> Map.of(
                        "name", file.getName(),
                        "size", file.length(),
                        "isFile", file.isFile(),
                        "canRead", file.canRead()
                    ))
                    .toList());
            }
        }
        
        return info;
    }
} 