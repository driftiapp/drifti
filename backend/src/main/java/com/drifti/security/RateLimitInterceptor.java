package com.drifti.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;

public class RateLimitInterceptor implements HandlerInterceptor {
    private final int maxRequests;
    private final int windowMs;
    private final Map<String, Queue<Long>> requestLog;

    public RateLimitInterceptor(int maxRequests, int windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requestLog = new ConcurrentHashMap<>();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIp(request);
        long now = System.currentTimeMillis();
        
        Queue<Long> requests = requestLog.computeIfAbsent(clientIp, k -> new LinkedBlockingQueue<>());
        
        // Remove requests outside the window
        while (!requests.isEmpty() && requests.peek() < now - windowMs) {
            requests.poll();
        }
        
        // Check if rate limit is exceeded
        if (requests.size() >= maxRequests) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("X-Rate-Limit-Retry-After", String.valueOf(requests.peek() + windowMs));
            response.getWriter().write("Rate limit exceeded. Please try again later.");
            return false;
        }
        
        // Add current request
        requests.offer(now);
        
        // Set rate limit headers
        response.setHeader("X-Rate-Limit-Limit", String.valueOf(maxRequests));
        response.setHeader("X-Rate-Limit-Remaining", String.valueOf(maxRequests - requests.size()));
        response.setHeader("X-Rate-Limit-Reset", String.valueOf(now + windowMs));
        
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
} 