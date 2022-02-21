function RdPrompt(x, y, placeholder, defaultValue='', callback){
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const p = window.open('', 'prompt', `popup,frame=false,width=300,height=150,left=${x||0},top=${y||0}`)
    p.document.documentElement.innerHTML = `
        <html><head>
            <title>${isDarkMode ? '🗨' : '💬'}</title><meta name="color-scheme" content="light dark">
            <style>
                html, body, textarea {
                    box-sizing: border-box;
                    display: block;
                    width: 100vw;height: 100vh;
                    margin: 0;outline: none;border: 0;
                    font: 14px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;
                    resize: none;
                }
                @supports (-webkit-backdrop-filter: blur(1px)) {
                    textarea { background: Window; }
                }
                textarea {
                    padding: 10px;
                }
            </style>
        </head><body>
            <textarea 
                type="text" 
                autoFocus 
                maxlength="5000"
                placeholder="${placeholder}">
            </textarea>
        </body></html>
    `

    function submit(e) {
        e.preventDefault()
        e.stopPropagation()
        callback(textarea.value)
        p.close()
    }

    const textarea = p.document.querySelector('textarea')
    textarea.value = defaultValue
    textarea.setSelectionRange(0, textarea.value.length)
    textarea.addEventListener('blur', submit)
    textarea.addEventListener('keydown', e=>{
        switch(e.code) {
            case 'Enter':
                if (e.metaKey || e.ctrlKey)
                    e.target.value+="\n"
                else if (!e.shiftKey)
                    submit(e)
            break
            case 'Escape':
                textarea.value = defaultValue
                submit(e)
            break
        }
    })
    p.addEventListener('blur', submit)
}

class RdTooltip {
    _parent = null //RdHighlight
    _menu = null
    _listeners = {} //{ onColorClick(color), onNoteClick(x,y), onRemoveClick() }

    _hidden = true
    _colors = ['yellow', 'blue', 'green', 'red']

    _classMenu = 'rdhm'
    _classButtonColor = 'rdhbh'
    _classButtonNote = 'rdhbn'
    _classButtonRemove = 'rdhbr'
    _idCss = 'rdhss'
    _attrColor = 'data-rdhsc'

    constructor(parent, { onColorClick, onNoteClick, onRemoveClick }) {
        this._parent = parent
        this._listeners = { onColorClick, onNoteClick, onRemoveClick }

        //init
        this._initStyles()
        this._initMenu()

        //bind
        this.show = this.show.bind(this)
        this.hide = this.hide.bind(this)
        this._windowMouseDown = this._windowMouseDown.bind(this)
        this._windowResize = this._windowResize.bind(this)

        //events
        this._parent._window.removeEventListener('mousedown', this._windowMouseDown)
        this._parent._window.addEventListener('mousedown', this._windowMouseDown)
        this._parent._window.removeEventListener('resize', this._windowResize)
        this._parent._window.addEventListener('resize', this._windowResize)
    }

    show(x, y, activeColor='', activeNote=false, activeRemove=false) {
        //position
        let left = x
        let top = y
        if (this._parent._window.outerWidth <= left + 80) left = left - 80
        if (this._parent._window.scrollY > top) top = this._parent._window.scrollY
        this._menu.setAttribute('style', `left: ${left}px !important; top: ${top}px !important;`)

        //color active
        this._menu.querySelectorAll(`[${this._attrColor}]`).forEach(e=>e.removeAttribute('data-active'))
        if (activeColor) {
            const color = this._menu.querySelector(`[${this._attrColor}="${activeColor.trim()}"]`)
            if (color) color.setAttribute('data-active', 'true')
        }

        //note active
        const note = this._menu.querySelector(`.${this._classButtonNote}`)
        if (activeNote)
            note.setAttribute('data-badge', '1')
        else
            note.removeAttribute('data-badge')

        //remove button visibility
        const remove = this._menu.querySelector(`.${this._classButtonRemove}`)
        remove.setAttribute('hidden', activeRemove ? 'false' : 'true')

        //menu visibility
        this._menu.removeAttribute('hidden')
        this._hidden = false
    }

    hide() {
        if (this._menu) {
            this._hidden = true
            this._menu.setAttribute('hidden', 'true')
        }
    }

    /* Window events */
    _windowMouseDown(e) {
        if (this._hidden) return
        if (e.target == this._menu) return
        if (this._menu.contains(e.target)) return

        this.hide()
    }

    _windowResize() {
        if (this._hidden) return
        this.hide()
    }

    /* Buttons */
    _colorClick(e) {
        e.preventDefault()
        if (typeof this._listeners.onColorClick != 'function') return
        this._listeners.onColorClick(e.currentTarget.getAttribute(this._attrColor) || '')
    }

    _noteClick(e) {
        e.preventDefault()
        if (typeof this._listeners.onNoteClick != 'function') return
        this._listeners.onNoteClick(e.screenX - 14, e.screenY - 14)
    }

    _removeClick(e) {
        e.preventDefault()
        if (typeof this._listeners.onRemoveClick != 'function') return
        this._listeners.onRemoveClick()
    }

    /* Menu */
    _initMenu() {
        if (this._menu)
            return

        //create menu
        this._menu = this._parent._document.createElement('menu')
        this._menu.className = this._classMenu
        this._menu.setAttribute('hidden', 'true')
        this._menu.innerHTML = `
            <li title="Highlight">
                ${this._colors.map(color=>`
                    <button class="${this._classButtonColor}" ${this._attrColor}="${color}"></button>
                `).join('')}
            </li>
            
            <button class="${this._classButtonNote}" title="Add note...">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M15 1a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3v1.9a1 1 0 0 1-1.6.7L10.2 16H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3h11Zm0 1H4c-1 0-2 .8-2 1.9V13c0 1 .8 2 1.9 2h6.7l3.4 2.9V15h1c1 0 2-.8 2-1.9V4c0-1-.8-2-1.9-2H15Zm-5 3v3h3v1h-3v3H9V9H6V8h3V5h1Z"/></svg>
            </button>

            <button class="${this._classButtonRemove}" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M12 1c.6 0 1 .4 1 1v2h5c.6 0 1 .4 1 1h-2v12c0 1-1 2-2 2H5c-1 0-2-1-2-2V5H1c0-.6.4-1 1-1h5V2c0-.6.4-1 1-1Zm4 4H4v11.8c0 .7.4 1.2 1 1.2h10c.6 0 1-.5 1-1.2V5ZM9 9v5H8V9h1Zm3 0v5h-1V9h1Zm-.5-7h-3c-.3 0-.5.2-.5.5V4h4V2.5c0-.3-.2-.5-.5-.5Z"/></svg>
            </button>
        `
        this._parent._container.appendChild(this._menu)

        //add click events
        this._menu.querySelectorAll(`.${this._classButtonColor}`)
            .forEach(e=>{
                this._colorClick = this._colorClick.bind(this)
                e.removeEventListener('click', this._colorClick)
                e.addEventListener('click', this._colorClick)
            })

        this._menu.querySelectorAll(`.${this._classButtonNote}`)
            .forEach(e=>{
                this._noteClick = this._noteClick.bind(this)
                e.removeEventListener('click', this._noteClick)
                e.addEventListener('click', this._noteClick)
            })

        this._menu.querySelectorAll(`.${this._classButtonRemove}`)
            .forEach(e=>{
                this._removeClick = this._removeClick.bind(this)
                e.removeEventListener('click', this._removeClick)
                e.addEventListener('click', this._removeClick)
            })
    }

    /* Styles */
    _initStyles() {
        if (this._parent._container.querySelector(`#${this._idCss}`))
            return

        const style = this._parent._document.createElement('style')
        style.id = this._idCss
        style.innerHTML = `
            .${this._classMenu} {
                position: absolute !important;
                display: flex !important;
                
                z-index: 99999999 !important;
                background-color: transparent !important;
                margin: 4px !important;
                width: auto !important;
                height: auto !important;
                left: 0 !important; top: 0 !important;
                box-shadow: none !important;
                animation: none !important;
                transition: opacity .15s ease-in-out !important;
                will-change: opacity;
                border: 0 !important;
                padding: 0 !important;
                backdrop-filter: blur(20px) !important;
                -webkit-backdrop-filter: blur(20px) !important;
            }
            .${this._classMenu}, .${this._classMenu} *, .${this._classMenu}:after {
                border-radius: 5px !important;
            }
            .${this._classMenu}:after {
                content: '' !important;
                position: absolute !important;
                left: 0 !important; top: 0 !important; right: 0 !important; bottom: 0 !important;
                z-index: -1 !important;
                background-color: Menu !important;
                box-shadow: 0 0 0 0.5px GrayText, 0 5px 30px rgb(0 0 0 / 30%) !important;
            }
            @supports (backdrop-filter: blur(20px)) {
                .${this._classMenu}:after { opacity: .6 !important; }
            }
            @supports (-webkit-backdrop-filter: blur(20px)) {
                .${this._classMenu}:after {
                    opacity: .6 !important;
                    background-color: Window !important;
                }
            }
            .${this._classMenu}, .${this._classMenu} * {
                box-sizing: border-box !important;
                user-select: none !important;
                -webkit-user-select: none !important;
            }
            .${this._classMenu}[hidden='true'] {
                pointer-events: none !important;
                opacity: 0 !important;
            }

            /* Dropdown */
            .${this._classMenu} > li {
                display: flex !important;
                flex-direction: column !important;
                flex-wrap: wrap; !important;
                max-height: 32px !important;
                transition: max-height .15s ease-in !important;
                transition-delay: .1s !important;
                will-change: max-height;
                overflow: hidden !important;
            }

            .${this._classMenu} > li:hover:not(:active) {
                max-height: ${this._colors.length * 32}px !important;
            }

            /* Buttons */
            .${this._classMenu} button {
                cursor: pointer !important;
                color: WindowText !important;
                width: 32px !important;
                height: 32px !important;
                appearance: none !important;
                background: transparent !important;
                border: 0 !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: background .1s linear, color .1s linear !important;
                will-change: background, color;
                filter: none !important;
                position: relative !important;
            }
            .${this._classMenu} button:hover {
                background: rgba(100,100,100,.3) !important;
            }
            .${this._classMenu} button:active {
                filter: brightness(50%) !important;
            }
            .${this._classMenu} button[hidden='true'] {
                display: none !important;
            }
            .${this._classMenu} button[data-badge]:before {
                content: attr(data-badge) !important;
                width: 16px !important;
                height: 16px !important;
                border-radius: 14px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: red !important;
                color: white !important;
                position: absolute !important;
                top: -3px !important;
                right: -3px !important;
                font-size: 11px !important;
                line-height: 11px !important;
                font-weight: 600 !important;
                box-shadow: inset 0 0 0 .5px rgba(255,255,255,.2), 0 0 0 0.5px rgba(0,0,0,.2), 0 3px 15px rgba(0,0,0,.2) !important;
            }
            .${this._classMenu} button[data-active='true'] {
                order: -1 !important;
            }

            .${this._classMenu} * {
                fill: currentColor !important;
            }

            /* Color */
            .${this._classMenu} button[${this._attrColor}]:before {
                content: '' !important;
                display: block !important;
                width: 18px !important;
                height: 18px !important;
                border-radius: 18px !important;
                box-shadow: inset 0 0 0 0.5px rgba(0,0,0,.4) !important;
                background-image: linear-gradient(to bottom, rgba(255,255,255,.5) 0, rgba(255,255,255,.4) 100%) !important;
            }
            ${this._colors.map(color=>`
                .${this._classMenu} button[${this._attrColor}=${color}]:before { background-color: ${color} !important; }
            `).join('')}
        `
        this._parent._container.appendChild(style)
    }
}

class RdSelection {
    _parent = null //RdHighlight
    _tooltip = null

    constructor(parent) {
        this._parent = parent
        this._tooltip = new RdTooltip(parent, {
            onColorClick: color=>this._parent.addSelection({ color }),
            onNoteClick: (x, y)=>this._parent.noteSelection(x, y)
        })

        //bind
        this.render = this.render.bind(this)
        this._onSelectionChange = this._onSelectionChange.bind(this)

        //add event listeners
        this._parent._document.removeEventListener('selectionchange', this._onSelectionChange)
        this._parent._document.addEventListener('selectionchange', this._onSelectionChange)
        this._parent._window.removeEventListener('focus', this.render)
        this._parent._window.addEventListener('focus', this.render)
        this._parent._window.removeEventListener('blur', this.render)
        this._parent._window.addEventListener('blur', this.render)

        //try
        this._onSelectionChange()
    }

    have() {
        const selection = this._parent._window.getSelection()
        return selection && selection.rangeCount>0 && !selection.isCollapsed && selection.toString().trim().length>0
    }

    render() {
        //remove tooltip if no selection yet
        if (!this._parent.enabled || 
            !this.have() || 
            !this._parent._document.hasFocus()){
            this._tooltip.hide()
            return
        }

        //position menu
        const selection = this._parent._window.getSelection()
        const { x, y, width } = selection.getRangeAt(0).getBoundingClientRect()
        let left = this._parent._window.scrollX+x+width
        let top = this._parent._window.scrollY+y-32
        this._tooltip.show(left, top)
    }

    /* User changed document selection event */
    _onSelectionChange() {
        clearTimeout(this._selectTimeout)
        this._selectTimeout = setTimeout(this.render, this.have() ? 200 : 0)
    }
}

/*
    How to use?
        const rdh = new RdHighlight(document.body)
        rdh.enabled = true
        rdh.pro = true
        rdh.nav = true

        rdh.apply([...{_id, text, color, note}])
        rdh.onEdit = (id) => {}
        rdh.onAdd = ({text, color, note}) => {}
*/
class RdHighlight {
    _container = null
    _window = null
    _document = null

    _selection = null
    _tooltip = null
    _activeMarkId = null

    _attrId = 'data-rdhid'
    _idCss = 'rdhs'
    _cssColorVar = '--rdhc'
    _classNoteIcon = 'rdhni'
    _classNav = 'rdhnav'

    //configuration
    enabled = false
    pro = false
    nav = false

    //events
    onUpdate = ()=>{} //({_id, note...})=>{}
    onRemove = ()=>{} //({_id})=>{}
    onAdd = ()=>{} //({text,color,note})=>{}

    constructor(container) {
        this._container = container
        this._document = this._container.ownerDocument
        this._window = this._document.defaultView

        //bind
        this._markClick = this._markClick.bind(this)
        this._markColorClick = this._markColorClick.bind(this)
        this._markNoteClick = this._markNoteClick.bind(this)
        this._markRemoveClick = this._markRemoveClick.bind(this)
        this._navClick = this._navClick.bind(this)

        //init select menu
        this._selection = new RdSelection(this)
        this._tooltip = new RdTooltip(this, {
            onColorClick: this._markColorClick,
            onNoteClick: this._markNoteClick,
            onRemoveClick: this._markRemoveClick
        })
    }

    /* Mark highlight array of { text, color, _id } */
    apply(highlights=[]) {
        this.reset()
        this._initStyles()

        if (Array.isArray(highlights))
            for(const highlight of highlights)
                this.mark(
                    this._getCanditates(
                        this._getTextNodes(this._container),
                        highlight.text
                    ),
                    highlight
                )
    }

    /* Test */
    test(text='') {
        if (text.length > 10000) return false
        const nodes = this._getTextNodes(this._container)
        const candidates = this._getCanditates(nodes, text)
        return candidates.size > 0
    }

    /* Clean up all existing mark's */
    reset() {
        this._container.querySelectorAll(`mark[${this._attrId}]`)
            .forEach(e=>e.outerHTML = e.innerText)
        this._container.querySelectorAll(`.${this._classNav}`)
            .forEach(e=>e.remove())
    }

    /* Scroll to id */
    scrollToId(id) {
        if (!id) return

        const mark = this._container.querySelector(`mark[${this._attrId}="${String(id)}"]`)
        if (mark)
            mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    /* Add selection */
    addSelection(details={}) {
        if (typeof this.onAdd != 'function') return

        const selection = this._window.getSelection()
        if (!selection.rangeCount) return
        const text = selection.getRangeAt(0).toString().trim()

        if (!this.test(text)) {
            alert('⚠️ Unfortunately we can\'t add this text')
            return
        }
        
        this.onAdd({ ...details, text })
        selection.removeAllRanges()
    }

    noteSelection(x, y) {
        if (!this.pro)
            return alert(`Notes/annotations only available in Pro plan`)

        RdPrompt(x, y, 'Add note...', '', note=>{
            if (note.trim())
            this.addSelection({
                note
            })
        })
    }

    copySelection() {
        this._document.execCommand('copy')
    }

    /* Wrap all canditates in <mark> tag */
    mark(candidates, { _id, color, note }) {
        let i = 0
        
        for(const [node, phrase] of candidates){
            //create text range to be highlighted
            var range = new Range()
            let start = 0
            let end = node.textContent.length

            //first or last node
            if (i == 0 || i == candidates.size-1) {
                start = Math.max(node.textContent.indexOf(phrase), 0)
                end = start + phrase.length
            }

            range.setStart(node, start)
            range.setEnd(node, end)

            //create mark tag
            const mark = this._document.createElement('mark')
            mark.setAttribute(this._attrId, _id)
            if (color && color != 'yellow')
                mark.setAttribute('style', `${this._cssColorVar}: ${color}`)
            if (note)
                mark.setAttribute('title', note)
            mark.addEventListener('click', this._markClick)
            mark.addEventListener('contextmenu', this._markClick)

            //wrap text in mark tag
            range.surroundContents(mark)

            //note icon for last
            if (i == candidates.size-1 && note)
                mark.insertAdjacentHTML('beforeend', `<svg class="${this._classNoteIcon}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
                    <path d="M8 0a2 2 0 0 1 2 2v8L6 8H2a2 2 0 0 1-2-2V2C0 .9.9 0 2 0h6ZM2 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>
                </svg>`)

            //nav
            if (this.nav && i == 0){
                const nav = this._document.createElement('a')
                nav.className = this._classNav
                nav.setAttribute(this._attrId, _id)                    
                const pos = range.getBoundingClientRect()
                nav.setAttribute('style', `
                    ${color && color != 'yellow' ? `${this._cssColorVar}: ${color};`:''}
                    top: ${100/this._document.documentElement.scrollHeight * (this._window.scrollY + pos.top - 10)}%;
                `.trim())
                nav.addEventListener('click', this._navClick)
                this._container.appendChild(nav)
            }

            //free up memory
            range.detach()

            i++
        }
    }

    /* Mark mouse event listener */
    _markClick(e) {
        if (e.currentTarget.parentElement.tagName == 'A') return

        e.preventDefault()
        e.stopPropagation()

        const mark = e.currentTarget
        const id = mark.getAttribute(this._attrId)
        const color = (getComputedStyle(mark).getPropertyValue(this._cssColorVar) || '').trim()
        const hasNote = mark.hasAttribute('title')

        this._activeMarkId = id
        this._tooltip.show(e.pageX, e.pageY, color, hasNote, true)
    }

    _markColorClick(color) {
        if (!this._activeMarkId) return

        this.onUpdate({
            _id: this._activeMarkId,
            color
        })
        this._tooltip.hide()
    }

    _markNoteClick(x, y) {
        if (!this._activeMarkId) return

        const mark = this._container.querySelector(`[${this._attrId}="${this._activeMarkId}"]`)
        const note = mark.getAttribute('title') || ''

        RdPrompt(x, y, 'Note...', note, updated=>{
            this.onUpdate({
                _id: this._activeMarkId,
                note: updated
            })
        })
        this._tooltip.hide()
    }

    _markRemoveClick() {
        if (!this._activeMarkId) return

        const mark = this._container.querySelector(`[${this._attrId}="${this._activeMarkId}"]`)
        const confirmed = mark.hasAttribute('title') ? confirm('Remove highlight?') : true
        if (!confirmed) return

        this.onRemove({ _id: this._activeMarkId })
        this._tooltip.hide()
    }

    /* Navigation event listener */
    _navClick(e) {
        e.preventDefault()
        e.stopPropagation()
        const nav = e.currentTarget
        const id = nav.getAttribute(this._attrId)
        this.scrollToId(id)
    }

    /* Styles */
    _initStyles() {
        if (this._container.querySelector(`#${this._idCss}`))
            return

        const style = this._document.createElement('style')
        style.id = this._idCss
        style.innerHTML = `
            mark[${this._attrId}], .${this._classNav}:before {
                background: var(${this._cssColorVar}, #ffee00) !important;
                user-select: none !important;
                -webkit-user-select: none !important;
            }
            mark[${this._attrId}] {
                background-image: linear-gradient(to bottom, rgba(255,255,255,.7) 0, rgba(255,255,255,.7) 100%) !important;
                color: black !important;
                cursor: pointer !important;
            }
            .${this._classNoteIcon} {
                display: inline !important;
                margin: 0 !important;
                padding: 0 !important;
                border: 0 !important;
                color: inherit !important;
                opacity: 0.5 !important;
                fill: currentColor !important;
                background: transparent !important;
                border-radius: 0 !important;
                margin-left: 0.3em !important;
                margin-right: 0.3em !important;
                width: 0.85em !important;
                height: 0.85em !important;
            }
            .${this._classNav} {
                position: fixed !important;
                right: 0px !important;
                padding: 10px !important;
                padding-right: 6px !important;
                cursor: pointer !important;
            }
            .${this._classNav}:before {
                content: '' !important;
                display: block !important;
                width: 10px !important;
                height: 10px !important;
                border-radius: 4px !important;
                box-shadow: 0 0 0 0.5px ButtonShadow, 0 5px 30px rgb(0 0 0 / 30%) !important;
                background-image: linear-gradient(to bottom, rgba(255,255,255,.2) 0, rgba(255,255,255,.2) 100%) !important;
            }
            .${this._classNav}:hover:before {
                background-image: linear-gradient(to bottom, rgba(255,255,255,.5) 0, rgba(255,255,255,.5) 100%) !important;
            }
            .${this._classNav}:active {
                filter: brightness(50%) !important;
            }
        `
        this._container.appendChild(style)
    }

    /* Find text nodes that match source text with match phrase */
    /* -> Map<node:phrase> */
    _getCanditates(nodes, source) {
        let candidates = new Map()
        let carret = 0

        for(const node of nodes){
            let matches = 0

            //clear candidates if current node includes full phrase
            //otherwise start node can be invalid
            if (
                carret &&
                node.textContent.replace(/ /gm, ' ').includes(source.substring(0, carret+1).trim())
            ) {
                carret = 0
                candidates.clear()
            }

            do {
                //ignore any whitespace
                if (!source[carret].trim()) {
                    matches++
                    carret++
                    continue
                }

                const phrase = source.substring(carret-matches, carret+1)

                //phrase included
                if (node.textContent.replace(/ /gm, ' ').includes(phrase)){
                    matches++
                    carret++
                    candidates.set(node, phrase)
                }
                //not found
                else {
                    if (
                        !matches &&
                        carret < source.length
                    ) {
                        carret = 0
                        candidates.clear()
                    }
                    break
                }
            } while (carret < source.length)

            if (carret >= source.length)
                break
        }

        return candidates
    }

    /* Find all text nodes only */
    _getTextNodes(node) {
        if (!node || !node.childNodes) return
        const textNodes = []
        for(const child of node.childNodes)
            switch(child.nodeType) {
                case 1: //element node
                    if (
                        child.offsetParent && //ignore invisible
                        !child.hasAttribute(this._attrId) //ignore already marked elements
                    )
                        textNodes.push(...this._getTextNodes(child)); 
                    break
                case 3: //text node
                    if (child.textContent.trim())
                        textNodes.push(child)
                    break
            }
        return textNodes
    }
}


/* Auto-init for embeded pages */
let rdh
let rdhEmbed = {
    enabled: false,
    wait: [],
    send: ()=>{},       //(type,payload)
    receive: ()=>{}    //(type,payload)
}

//extension inject script
if (
    (typeof chrome == 'object' && chrome.runtime && chrome.runtime.onMessage) || 
    (typeof browser == 'object' && browser.runtime && browser.runtime.onMessage)
) {
    const browser = window.browser || window.chrome
    rdhEmbed.enabled = true

    rdhEmbed.send = (type, payload)=>
        browser.runtime.sendMessage(null, { type, payload })

    const onMessage = ({ type, payload }, sender) => {
        if (sender.id != browser.runtime.id) return //only messages from bg script of current extension allowed
        if (typeof type !== 'string') return
        if (typeof payload != 'undefined' && typeof payload != 'object') return
        rdhEmbed.receive(type, payload)
    }
    browser.runtime.onMessage.removeListener(onMessage)
    browser.runtime.onMessage.addListener(onMessage)
}

//electron
else if (typeof require == 'function') {
    rdhEmbed.enabled = true
    
    const { ipcRenderer } = require('electron')
    rdhEmbed.send = (type, payload) => ipcRenderer.sendToHost('RDH', { type, payload })

    const onMessage = (_, data) => rdhEmbed.receive(data.type, data.payload)
    ipcRenderer.removeListener('RDH', onMessage)
    ipcRenderer.on('RDH', onMessage)
}

//iframe
else if (window.self !== window.top) {
    rdhEmbed.enabled = true

    rdhEmbed.send = (type, payload)=>
        window.parent.postMessage({ type, payload }, '*')

    const onMessage = ({ data, source }) => {
        if (source !== window.parent || typeof data !== 'object' || typeof data.type !== 'string') return
        if (typeof data.payload != 'undefined' && typeof data.payload != 'object') return
        rdhEmbed.receive(data.type, data.payload)
    }
    window.removeEventListener('message', onMessage)
    window.addEventListener('message', onMessage)
}

if (rdhEmbed.enabled){
    rdhEmbed.receive = (type, payload)=>{
        //document is not ready yet, add to wait list
        if (!rdh){
            rdhEmbed.wait.push({ type, payload })
            return
        }

        switch(type) {
            case 'RDH_APPLY':
                rdh.apply(payload)
            break

            case 'RDH_CONFIG':
                if (typeof payload.enabled == 'boolean')
                    rdh.enabled = payload.enabled
                if (typeof payload.pro == 'boolean')
                    rdh.pro = payload.pro
                if (typeof payload.nav == 'boolean')
                    rdh.nav = payload.nav
            break

            case 'RDH_SCROLL':
                rdh.scrollToId(payload._id)
            break

            case 'RDH_ADD_SELECTION':
                rdh.addSelection(payload)
            break

            case 'RDH_NOTE_SELECTION':
                rdh.noteSelection()
            break
        }
    }

    function RdhOnDocumentLoad() {
        window.removeEventListener('load', RdhOnDocumentLoad)

        rdh = new RdHighlight(document.body)
        rdh.onUpdate = details => rdhEmbed.send('RDH_UPDATE', details)
        rdh.onRemove = details => rdhEmbed.send('RDH_REMOVE', details)
        rdh.onAdd = details => rdhEmbed.send('RDH_ADD', details)

        //repeat waiting messages
        if (rdhEmbed.wait.length) {
            for(const { type, payload } of rdhEmbed.wait)
                rdhEmbed.receive(type, payload)
            rdhEmbed.enabled = []
        }

        rdhEmbed.send('RDH_READY', { url: location.href })
    }
    
    if (document.readyState == 'complete')
        RdhOnDocumentLoad()
    else {
        window.removeEventListener('load', RdhOnDocumentLoad)
        window.addEventListener('load', RdhOnDocumentLoad)
    }
}