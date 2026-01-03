ace.define("ace/mode/abcode", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/text_highlight_rules"], function(require, exports, module) {
    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
    
    var ABCodeHighlightRules = function() {
        this.$rules = {
            "start": [
                // Comments
                {
                    token: "comment",
                    regex: /#.*$/
                },
                // ABCode keywords (directives)
                {
                    token: "keyword",
                    regex: /\b(goal|type|fun|if|when|else|for|do|try|fail|use|run|pass|var|val|set|echo|read|save|web|dbc|like|form|plug|case|each):/
                },
                // Strings in double quotes
                {
                    token: "string",
                    regex: /"(?:[^"\\]|\\.)*"/
                },
                // Strings in single quotes
                {
                    token: "string",
                    regex: /'(?:[^'\\]|\\.)*'/
                },
                // JavaScript functions and methods
                {
                    token: "support.function",
                    regex: /\b(System\.out\.print|System\.out\.println|console\.log|print|println)\b/
                },
                // Parentheses and brackets
                {
                    token: "paren.lparen",
                    regex: /[\(\[]/
                },
                {
                    token: "paren.rparen", 
                    regex: /[\)\]]/
                },
                // Numbers
                {
                    token: "constant.numeric",
                    regex: /\b\d+(?:\.\d+)?\b/
                },
                // Indentation (important for ABCode structure)
                {
                    token: "text",
                    regex: /^\s+/
                },
                // Default token
                {
                    defaultToken: "text"
                }
            ]
        };
    };
    
    oop.inherits(ABCodeHighlightRules, TextHighlightRules);
    
    var Mode = function() {
        this.HighlightRules = ABCodeHighlightRules;
        this.$behaviour = this.$defaultBehaviour;
    };
    oop.inherits(Mode, TextMode);
    
    (function() {
        this.lineCommentStart = "#";
        this.$id = "ace/mode/abcode";
    }).call(Mode.prototype);
    
    exports.Mode = Mode;
});