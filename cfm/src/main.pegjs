start = markdown

newline = "\n" { return {type: 'newline'} }
normalchar = a:[^\n]
space = ' '
codeFence = "```"
spoilerFence = "||"
startSummary = "<summary>"
stopSummary = "</summary>"
startDetails = "<details>"
stopDetails = "</details>"
EOF = !.

markdown = l:(Block / newline)+
{
	return l
}

Block = Heading / CodeBlock / Details / Line

Summary = startSummary l:(!stopSummary normalchar)* stopSummary newline?
{
    return {
        type: "Summary",
        body: l.map(a=>a[1]).join('')
    }
}

Details = startDetails newline? s:Summary? a:(!stopDetails (Block / newline))* newline? stopDetails (newline / EOF)
{
    return {
        type: "Details",
        summary: s,
        body: a.flat().filter(e => e)
    }
}

CodeBlock = codeFence l:[a-z]* newline c:CodeLines codeFence (newline / EOF)
{
    return {
        type: "CodeBlock",
        lang: l.join(''),
        body: c
    }
}

CodeLines = l:CodeLine*
{
    return l.join('\n')
}

CodeLine = !codeFence a:normalchar* newline
{
    return a.join('')
}

Heading = h:"#"+ space t:Line (newline / EOF)
{
  return {
     type: "Heading",
     level: h.length,
     body: t
  }
}

Image = "![" a:[^\]]* "](" u:[^)]+ ")"
{
    return {
    	type: "Image",
        alt: a.join(''),
        url: u.join('')
    }
}

EmojiPack = "<emojipack" space* "src" space* "=" space* "\"" body:[^"]+ "\"" space* "/"? ">" "</emojipack>"?
{
    return {
        type: "EmojiPack",
        body: body.join('')
    }
}



InlineCode = "`" a:[^`]+ "`"
{
	return {
    	type: "InlineCode",
        body: a.join('')
    }
}

URL = s:("https://" / "http://") t:[^ ]+
{
    return {
        type: "URL",
        body: s + t.join('')
    }
}

Emoji = ":" s:[a-zA-Z0-9_]+ ":"
{
    return {
		type: "Emoji",
        body: s.join('')
    }
}

Mention = "@" a:[a-zA-Z0-9@]+
{
	return {
    	type: "Mention",
        body: a.join('')
    }
}

Tag = "#" a:[^ \n#]+
{
    const value = a.join('')
    const split = value.split('@')
    if (split.length === 2) {
        return {
            type: "Timeline",
            body: value
        }
    } else {
        return {
            type: "Tag",
            body: value
        }
    }
}

Spoiler = spoilerFence content:(!spoilerFence .)* spoilerFence
{
    return {
        type: "Spoiler",
        body: content.map(c => c[1]).join('')
    }
}


Line = e:HeadElement f:InlineElements* (newline / EOF)
{
    const body = []
    let textbuf = ""
    for (const elem of [e, f].flat(Infinity)) {
        if (typeof elem === "string") {
            textbuf += elem
        } else {
            if (textbuf !== "") {
                body.push({
                    type: "Text",
                    body: textbuf
                })
                textbuf = ""
            }
            body.push(elem)
        }
    }

    if (textbuf !== "") {
        body.push({
            type: "Text",
            body: textbuf
        })
        textbuf = ""
    }

    return {
        type: "Line",
        body: body
    }
}

HeadElement = (Spoiler / URL / Emoji / InlineCode / Image / EmojiPack / Tag / Mention / normalchar)
InlineElements = (Spoiler / URL / Emoji / InlineCode / Image / EmojiPack / space+ Tag / space+ Mention / normalchar) +

