package com.roma.qurie.notice;

/**
 * 공지 작성자가 어느 테이블에 있는지 구분한다. 마스터는 masters, 매니저는 ordinary_users 로
 * 계정 테이블이 나뉘어 있어 created_by 값만으로는 작성자를 찾을 수 없다.
 *
 * todo: masters 를 ordinary_users 로 합치기로 하면 이 enum 과 created_by_type 컬럼은 사라진다.
 */
public enum NoticeAuthorType {

    MASTER,
    MANAGER
}
