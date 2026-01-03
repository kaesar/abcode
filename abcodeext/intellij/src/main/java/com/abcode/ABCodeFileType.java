package com.abcode;

import com.intellij.openapi.fileTypes.LanguageFileType;
import com.intellij.openapi.util.IconLoader;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import javax.swing.*;

public class ABCodeFileType extends LanguageFileType {
    public static final ABCodeFileType INSTANCE = new ABCodeFileType();

    private ABCodeFileType() {
        super(ABCodeLanguage.INSTANCE);
    }

    @NotNull
    @Override
    public String getName() {
        return "ABCode";
    }

    @NotNull
    @Override
    public String getDescription() {
        return "ABCode programming language file";
    }

    @NotNull
    @Override
    public String getDefaultExtension() {
        return "abc";
    }

    @Nullable
    @Override
    public Icon getIcon() {
        return IconLoader.getIcon("/icons/abcode.png", ABCodeFileType.class);
    }
}