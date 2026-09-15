on run argv
    set operation to item 1 of argv

    if operation is "prepare" then
        prepareJort(item 2 of argv)
    else if operation is "record" then
        recordDemo((item 2 of argv) as real, (item 3 of argv) as real)
    else
        error "Unknown operation: " & operation
    end if
end run

on prepareJort(appPath)
    do shell script "open " & quoted form of appPath
    tell application "System Events"
        repeat 100 times
            if exists process "Jort" then exit repeat
            delay 0.1
        end repeat

        tell process "Jort"
            set frontmost to true
            repeat 100 times
                if exists text area 1 of scroll area 1 of front window then exit repeat
                delay 0.1
            end repeat

            set position of front window to {80, 80}
            set size of front window to {1200, 760}
            set editor to text area 1 of scroll area 1 of front window
            set focused of editor to true
            keystroke "a" using command down
            key code 51
            delay 0.5
        end tell
    end tell
end prepareJort

on recordDemo(pmWaitSeconds, rewriteWaitSeconds)
    tell application "System Events"
        tell process "Jort"
            set frontmost to true
            set focused of text area 1 of scroll area 1 of front window to true
        end tell
    end tell
    delay 1

    typeBlock("# Personal" & linefeed & ¬
        "[] Book haircut" & linefeed & ¬
        "[] Pick up birthday gift for Alex" & linefeed & ¬
        "[] Plan weekend in Chicago" & linefeed & ¬
        "[] Finish reading Project Hail Mary" & linefeed & linefeed & ¬
        "# 1:1 - Lorelai" & linefeed & ¬
        "- Sync with team on Q3 goals" & linefeed & ¬
        "- Check with Lorelai about ", 0.012)

    typeBlock("/pm What project did Lorelai and I coordinate on?", 0.018)
    submitToolCall()
    waitForAndMergeToolResult(pmWaitSeconds)
    typeBlock(" progress" & linefeed & linefeed & ¬
        "# Random" & linefeed & ¬
        "- Sweet article on attention: http://joew.in/attention" & linefeed & ¬
        "- Look into garden ideas for next year Spring" & linefeed & ¬
        "- Look into birdhouse plans for Lin" & linefeed & linefeed & ¬
        "Hey team ", 0.007)
    pasteCharacter("—")
    typeBlock(" quick announcement: I wanted to share an update on our priorities for the next stretch so everyone has the same context and can plan accordingly. We", 0.007)
    pasteCharacter("’")
    typeBlock("re going to be focusing our energy on tightening up execution, keeping communication crisp, and making sure we", 0.007)
    pasteCharacter("’")
    typeBlock("re all aligned on what matters most week to week, especially as a few moving pieces continue to evolve.", 0.007)

    pressReturn()
    typeBlock("/rewrite", 0.04)
    chooseTool()
    selectPreviousParagraph()
    submitToolCall()
    waitForAndMergeToolResult(rewriteWaitSeconds)
    delay 2
end recordDemo

on typeBlock(theText, characterDelay)
    tell application "System Events"
        repeat with currentCharacter in characters of theText
            set characterText to currentCharacter as text
            if characterText is linefeed or characterText is return then
                key code 36
                delay 0.08
            else
                keystroke characterText
                delay characterDelay
            end if
        end repeat
    end tell
end typeBlock

on pasteCharacter(theCharacter)
    set oldClipboard to the clipboard
    set the clipboard to theCharacter
    tell application "System Events" to keystroke "v" using command down
    delay 0.03
    set the clipboard to oldClipboard
end pasteCharacter

on pressReturn()
    tell application "System Events" to key code 36
    delay 0.25
end pressReturn

on submitToolCall()
    tell application "System Events" to key code 36 using shift down
    delay 0.25
end submitToolCall

on chooseTool()
    tell application "System Events" to key code 36
    delay 0.5
end chooseTool

on selectPreviousParagraph()
    tell application "System Events" to key code 126 using {option down, shift down}
    delay 0.5
end selectPreviousParagraph

on waitForAndMergeToolResult(maximumWait)
    set elapsedTime to 0

    repeat while elapsedTime < maximumWait
        delay 0.5
        set elapsedTime to elapsedTime + 0.5
        set mergeButton to visibleMergeButton()
        if mergeButton is not missing value then
            delay 1
            tell application "System Events"
                tell process "Jort"
                    click mergeButton
                    delay 0.5
                    set editor to text area 1 of scroll area 1 of front window
                    set focused of editor to true
                    key code 124 using command down
                end tell
            end tell
            delay 1
            return
        end if
    end repeat

    error "Timed out waiting for Jort's tool result controls"
end waitForAndMergeToolResult

on visibleMergeButton()
    tell application "System Events"
        tell process "Jort"
            tell text area 1 of scroll area 1 of front window
                repeat with editorButton in every button
                    if description of editorButton is "Merge" then return editorButton
                end repeat
            end tell
        end tell
    end tell
    return missing value
end visibleMergeButton
