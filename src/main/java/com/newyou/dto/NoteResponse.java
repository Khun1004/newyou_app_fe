package com.newyou.dto;

import java.time.LocalDateTime;

import com.newyou.entity.Note;

import lombok.Getter;

/**
 * 메모를 앱으로 보낼 때 쓰는 모양.
 * 잠긴 메모는 목록에서 내용(content)을 비워서 보내요. (PIN을 넣으면 /unlock 으로 내용을 받아요)
 */
@Getter
public class NoteResponse {
    private final Long id;
    private final String title;
    private final String content;
    private final String category;
    private final String design;
    private final boolean locked;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    private NoteResponse(Note note, boolean showContent) {
        this.id = note.getId();
        this.title = note.getTitle();
        this.locked = note.isLocked();
        this.content = (note.isLocked() && !showContent) ? "" : note.getContent();
        this.category = note.getCategory();
        this.design = note.getDesign();
        this.createdAt = note.getCreatedAt();
        this.updatedAt = note.getUpdatedAt();
    }

    /** 잠긴 메모면 내용을 숨겨요 */
    public static NoteResponse masked(Note note) {
        return new NoteResponse(note, false);
    }

    /** 내용까지 모두 보여줘요 (PIN 확인 후, 또는 방금 쓴 메모) */
    public static NoteResponse full(Note note) {
        return new NoteResponse(note, true);
    }
}
