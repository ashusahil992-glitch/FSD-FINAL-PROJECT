package com.campusbazaar.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.campusbazaar.dto.NotificationDto;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

class NotificationStreamServiceTest {

    @Test
    void publishesOnlyToTheAuthenticatedRecipientsStream() {
        RecordingEmitter firstUser = new RecordingEmitter();
        RecordingEmitter secondUser = new RecordingEmitter();
        NotificationStreamService streamService = new NotificationStreamService() {
            private int created;

            @Override
            protected SseEmitter createEmitter() {
                return created++ == 0 ? firstUser : secondUser;
            }
        };
        streamService.subscribe(11L);
        streamService.subscribe(22L);

        streamService.publish(11L, new NotificationDto(
                7L, "New message", "A message arrived.", 3L, 4L, "Textbook",
                java.time.Instant.now(), null, "MESSAGE", "/messages/3", 9L));

        assertEquals(1, firstUser.eventCount);
        assertEquals(0, secondUser.eventCount);
    }

    private static final class RecordingEmitter extends SseEmitter {
        private int eventCount;

        @Override
        public void send(SseEventBuilder builder) throws IOException {
            eventCount++;
        }
    }
}
