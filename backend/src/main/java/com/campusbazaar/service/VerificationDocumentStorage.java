package com.campusbazaar.service;

import com.campusbazaar.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Locale;
import java.util.UUID;

@Component
public class VerificationDocumentStorage {

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private final Path storageDirectory;

    public VerificationDocumentStorage(
            @Value("${app.verification.storage-directory:${user.home}/.campusbazaar/private-documents}") String directory) {
        this.storageDirectory = Path.of(directory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(storageDirectory);
        } catch (IOException exception) {
            throw new IllegalStateException("Private verification document storage is unavailable.");
        }
    }

    public StoredDocument store(MultipartFile upload) {
        if (upload == null || upload.isEmpty()) {
            throw new BadRequestException("Upload a university ID document.");
        }
        if (upload.getSize() > MAX_SIZE_BYTES) {
            throw new BadRequestException("Verification documents must be 5 MB or smaller.");
        }

        String originalName = upload.getOriginalFilename();
        if (originalName == null || originalName.lastIndexOf('.') < 0) {
            throw new BadRequestException("Use a PDF, JPG, JPEG, or PNG verification document.");
        }
        String extension = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        String expectedType = switch (extension) {
            case "pdf" -> "application/pdf";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            default -> throw new BadRequestException("Use a PDF, JPG, JPEG, or PNG verification document.");
        };
        if (!expectedType.equalsIgnoreCase(upload.getContentType())) {
            throw new BadRequestException("The document file type does not match its content.");
        }

        try {
            byte[] content = upload.getBytes();
            if (!hasExpectedSignature(content, expectedType)) {
                throw new BadRequestException("The uploaded document is not a valid PDF, JPG, or PNG file.");
            }
            String key = UUID.randomUUID() + "." + extension;
            Path destination = resolve(key);
            Files.write(destination, content, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
            return new StoredDocument(key, expectedType);
        } catch (IOException exception) {
            throw new IllegalStateException("The verification document could not be stored securely.");
        }
    }

    public byte[] load(String key) {
        try {
            return Files.readAllBytes(resolve(key));
        } catch (IOException exception) {
            throw new IllegalStateException("The verification document could not be read.");
        }
    }

    public String contentType(String key) {
        String extension = Path.of(key).getFileName().toString();
        extension = extension.substring(extension.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            default -> throw new IllegalStateException("Unsupported stored verification document type.");
        };
    }

    public void delete(String key) {
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException exception) {
            throw new IllegalStateException("The verification document could not be removed.");
        }
    }

    private Path resolve(String key) {
        if (key == null || !key.matches("[0-9a-fA-F-]{36}\\.(pdf|jpg|jpeg|png)")) {
            throw new IllegalArgumentException("Invalid stored document key.");
        }
        Path resolved = storageDirectory.resolve(key).normalize();
        if (!resolved.getParent().equals(storageDirectory)) {
            throw new IllegalArgumentException("Invalid stored document path.");
        }
        return resolved;
    }

    private boolean hasExpectedSignature(byte[] content, String contentType) {
        return switch (contentType) {
            case "application/pdf" -> content.length >= 5
                    && content[0] == '%' && content[1] == 'P' && content[2] == 'D' && content[3] == 'F' && content[4] == '-';
            case "image/jpeg" -> content.length >= 3
                    && (content[0] & 0xff) == 0xff && (content[1] & 0xff) == 0xd8 && (content[2] & 0xff) == 0xff;
            case "image/png" -> content.length >= 8
                    && (content[0] & 0xff) == 0x89 && content[1] == 'P' && content[2] == 'N' && content[3] == 'G'
                    && content[4] == 0x0d && content[5] == 0x0a && content[6] == 0x1a && content[7] == 0x0a;
            default -> false;
        };
    }

    public record StoredDocument(String key, String contentType) {}
}
