package com.roma.qurie.notice;

/**
 * 공지 발송 대상 범위. 개인 발송은 지원하지 않아 USER 는 두지 않는다.
 */
public enum NoticeScope {

    ENTERPRISE,
    TRACK,
    CLASS
}
