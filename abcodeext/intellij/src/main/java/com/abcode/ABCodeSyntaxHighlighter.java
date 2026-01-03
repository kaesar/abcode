package com.abcode;

import com.intellij.lexer.Lexer;
import com.intellij.openapi.editor.DefaultLanguageHighlighterColors;
import com.intellij.openapi.editor.colors.TextAttributesKey;
import com.intellij.openapi.fileTypes.SyntaxHighlighterBase;
import com.intellij.psi.tree.IElementType;
import org.jetbrains.annotations.NotNull;

import static com.intellij.openapi.editor.colors.TextAttributesKey.createTextAttributesKey;

public class ABCodeSyntaxHighlighter extends SyntaxHighlighterBase {
    public static final TextAttributesKey DIRECTIVE =
            createTextAttributesKey("ABCODE_DIRECTIVE", DefaultLanguageHighlighterColors.KEYWORD);
    public static final TextAttributesKey COMMENT =
            createTextAttributesKey("ABCODE_COMMENT", DefaultLanguageHighlighterColors.LINE_COMMENT);
    public static final TextAttributesKey STRING =
            createTextAttributesKey("ABCODE_STRING", DefaultLanguageHighlighterColors.STRING);
    public static final TextAttributesKey NUMBER =
            createTextAttributesKey("ABCODE_NUMBER", DefaultLanguageHighlighterColors.NUMBER);

    private static final TextAttributesKey[] DIRECTIVE_KEYS = new TextAttributesKey[]{DIRECTIVE};
    private static final TextAttributesKey[] COMMENT_KEYS = new TextAttributesKey[]{COMMENT};
    private static final TextAttributesKey[] STRING_KEYS = new TextAttributesKey[]{STRING};
    private static final TextAttributesKey[] NUMBER_KEYS = new TextAttributesKey[]{NUMBER};
    private static final TextAttributesKey[] EMPTY_KEYS = new TextAttributesKey[0];

    @NotNull
    @Override
    public Lexer getHighlightingLexer() {
        return new ABCodeLexerAdapter();
    }

    @NotNull
    @Override
    public TextAttributesKey[] getTokenHighlights(IElementType tokenType) {
        if (tokenType.toString().contains("DIRECTIVE")) {
            return DIRECTIVE_KEYS;
        } else if (tokenType.toString().contains("COMMENT")) {
            return COMMENT_KEYS;
        } else if (tokenType.toString().contains("STRING")) {
            return STRING_KEYS;
        } else if (tokenType.toString().contains("NUMBER")) {
            return NUMBER_KEYS;
        } else {
            return EMPTY_KEYS;
        }
    }
}