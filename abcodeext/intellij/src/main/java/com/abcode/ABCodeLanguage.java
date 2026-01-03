package com.abcode;

import com.intellij.lang.Language;

public class ABCodeLanguage extends Language {
    public static final ABCodeLanguage INSTANCE = new ABCodeLanguage();

    private ABCodeLanguage() {
        super("ABCode");
    }
}