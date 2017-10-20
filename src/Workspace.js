// Copyright (c) 2016 Gherardo Varando (gherardo.varando@gmail.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

"use strict"
const storage = require('electron-json-storage')
const ToggleElement = require('./ToggleElement')
const fs = require('fs')
const {
  dialog
} = require('electron').remote
const util = require('./util.js')

class Workspace extends EventEmitter {
  constructor(options) {
    super()
    options = options || {}
    this.options = options
    this.spaces = {
      workspace: {
        path: ''
      }
    }
    if (!this.options.clean) {
      storage.get('workspace', (error, data) => {
        if (error) return
        if (data.workspace) {
          this.spaces = data || this.spaces
          this.emit('load')
        }
      })
    }
    window.addEventListener('beforeunload', (e) => {
      storage.set('workspace', this.spaces, (error) => {})
    })
    let a = 0
    setInterval(() => {
      storage.set('workspace', this.spaces, (error) => {})
    }, options.syncinterval || 30000)
  }

  // activate() {
  //   super.activate()
  //
  //
  //
  //   this.gui.header.actionsContainer.addButton({
  //     id: 'save',
  //     groupId: 'basetools',
  //     icon: 'fa fa-save',
  //     title: 'Save current workspace',
  //     action: () => {
  //       this.save()
  //     }
  //   })
  //
  //   this.gui.header.actionsContainer.addButton({
  //     id: 'load',
  //     groupId: 'basetools',
  //     icon: 'fa fa-folder-open-o',
  //     title: 'Load a workspace',
  //     action: () => {
  //       this.loadChecking()
  //     }
  //   })
  //   //this.pane = new ToggleElement(document.createElement('DIV'))
  //   //this.pane.element.className = 'pane padded'
  //   //this.treeView = new TreeList(this.pane.element, this.spaces)
  //   //this.element.appendChild(this.pane.element)
  //
  //   // this.addToggleButton({
  //   //     groupId: 'basetools',
  //   //     icon: 'fa fa-cubes',
  //   //     buttonsContainer: this.gui.header.actionsContainer
  //   // })
  //
  //
  // }

  addSpace(extension, object, overwrite) {
    if (extension) {
      if (object) {
        if (!overwrite && this.spaces[extension]) return
        this.spaces[extension] = object
      } else {
        if (extension._space) {
          this.addSpace(extension, extension._space)
        }
      }
    }
  }

  getSpace(extension) {
    if (extension) {
      return this.spaces[extension]
    }
  }

  newWorkspace(path) {
    this.spaces = {
      workspace: {
        path: path || ''
      }
    }
    this.emit('load')
  }

  reg() {
    storage.set('workspace', this.spaces)
  }

  safequit() {
    storage.set('workspace', this.spaces, (error) => {
      app.quit()
    })
  }

  removeSpace(extension) {
    delete this.spaces[extension]
  }

  new(path) {
    this.newWorkspace(path)
  }

  newChecking() {
    if (Object.keys(this.spaces).length < 2) {
      this.load()
      return
    }
    dialog.showMessageBox({
      title: 'Save workspace?',
      type: 'warning',
      buttons: ['Cancel', "Don't save", 'Save'],
      message: `Save the current workspace before creating a new one?`,
      detail: `Your changes will be lost if you do not save them`,
      noLink: true
    }, (id) => {
      if (id > 0) {
        if (id > 1) {
          this.save(this.spaces.workspace.path, () => {
            this.newWorkspace()
          })
        } else {
          this.newWorkspace()
        }
      }
    })
  }

  loadChecking() {
    if (Object.keys(this.spaces).length < 2) {
      this.load()
      return
    }
    dialog.showMessageBox({
      title: 'Save workspace?',
      type: 'warning',
      buttons: ['Cancel', "Don't save", 'Save'],
      message: `Save the current workspace before opening a new one?`,
      detail: `Your changes will be lost if you do not save them`,
      noLink: true
    }, (id) => {
      if (id > 0) {
        if (id > 1) {
          this.save(this.spaces.workspace.path, () => {
            this.load()
          })
        } else {
          this.load()
        }
      }
    })
  }


  save(path, cl, error) {
    let content = JSON.stringify(this.spaces)
    if (typeof path === 'string' && path != '') {
      fs.writeFile(path, content, (err) => {
        if (err && (typeof error === 'function')) {
          error(`An error ocurred creating the file  ${err.message}`)
        }
        this.spaces.workspace.path = path
        storage.set('workspace', this.spaces)
        if (typeof cl === 'function') {
          cl(path)
        }
      })
      return
    }
    dialog.showSaveDialog({
        title: 'Save the  current Workspace',
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      },
      (fileName) => {

        if (fileName === undefined) {
          err('no filename')
        }

        fs.writeFile(fileName, content, (err) => {
          if (err && (typeof error === 'function')) {
            error(`An error ocurred creating the file  ${err.message}`)
          }
          this.spaces.workspace.path = fileName
          storage.set('workspace', this.spaces)
          if (typeof cl === 'function') {
            cl(fileName)
          }
        })
      })
  }


  load(path, cl, err) {
    if (typeof path === 'string' && path != '') {
      wk = util.readJSONsync(path)
      this.spaces = wk
      storage.set('workspace', this.spaces)
      this.spaces.workspace = this.spaces.workspace || {
        path: ''
      }
      this.emit('load')
      return
    }
    dialog.showOpenDialog({
      title: "Load a Workspace",
      filters: [{
        name: 'JSON',
        extensions: ['json']
      }],
      properties: ['openFile']
    }, (file) => {
      let wk
      try {
        wk = util.readJSONsync(file[0])
      } catch (e) {
        this.gui.notify(e)
        return
      }
      try {
        this.spaces = wk
        this.spaces.workspace = this.spaces.workspace || {
          path: ''
        }
        storage.set('workspace', this.spaces)
        this.emit('load')
      } catch (e) {
        this.gui.notify(e)
      }
    })
  }


}


module.exports = Workspace
