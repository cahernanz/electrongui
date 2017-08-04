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

"use strict";
const {
  Menu,
  MenuItem
} = require('electron').remote;
const fs = require('fs');
const path = require('path');
const GuiExtension = require('./GuiExtension');
const Sidebar = require('./Sidebar.js');
const ToggleElement = require('./ToggleElement.js');
const util = require('./util.js');
const gui = require('./gui');


class ExtensionsManager extends GuiExtension {

  constructor() {
    super({
      menuLabel: 'Extensions',
      menuTemplate: [{
        label: 'Manager',
        click: () => {
          this.show();
        }
      }, {
        type: 'separator'
      }]
    });
    this.extensions = {};
    gui.extensions = this.extensions;
    this.activate();
  }

  activate() {
    this.sidebar = new Sidebar(this.element);
    this.sidebar.addList('list');
    //this.sidebar.hide();
    this.sidebar.list.addSearch({
      placeholder: 'Search extension'
    });

    //here put actions to load a new extension from custom file.
    this.pane = new ToggleElement(document.createElement('DIV'));
    this.element.appendChild(this.pane.element);
    this.appendMenu();
    gui.on('load:extension', (e) => {
      this.addExtension(e.extension);
    });
  }


  loadExtension(extPath, cl) {
    let ext;
    if (typeof extPath === 'string') {
      try {
        let tmp = require(extPath);
        if (tmp.prototype instanceof GuiExtension) {
          ext = new tmp();
          this.addExtension(this.extensions[ext.constructor.name]);
        }
      } catch (e) {
        console.log(e);
        ext = e;
      }
    } else {
      ext = 'trying to load non path extension';
    }
    if (typeof cl === 'function') {
      cl(ext);
    }
  }

  addTitle(title) {
    this.sidebar.list.addTitle(title);
  }

  hideAll() {
    Object.keys(this.extensions).map((name) => {
      this.extensions[name].hide();
    });
    this.hide();
  }



  addExtension(extension) {
    if (this.extensions[extension.constructor.name] instanceof GuiExtension) {
      this.extensions[extension.constructor.name].deactivate();
      this.sidebar.list.removeItem(extension.constructor.name);
    }
    this.extensions[extension.constructor.name] = extension;
    let menuitem = new MenuItem({
      label: extension.constructor.name,
      type: 'checkbox',
      click: (item) => {
        if (item.checked) {
          extension.activate();
        } else {
          extension.deactivate();
        }
      }
    });
    this.addMenuItem(menuitem);
    this.sidebar.addItem({
      id: extension.constructor.name,
      icon: `${extension.icon} fa-2x`,
      image: extension.image,
      title: extension.constructor.name,
      toggle: true,
      active: extension.active,
      onmouseover: () => {
        this.pane.clear();
        if (extension.author) {
          this.pane.appendChild(util.div('padded', `Author: ${extension.author}`));
        }
        this.pane.show();
      },
      onclick: {
        active: () => {
          extension.activate();
        },
        deactive: () => {
          extension.deactivate();
        }
      }
    });

    extension.on('deactivate', () => {
      this.sidebar.list.deactiveItem(extension.constructor.name);
      menuitem.checked = false;
    });

    extension.on('activate', () => {
      this.sidebar.list.activeItem(extension.constructor.name);
      menuitem.checked = true;
    });

    extension.on('show', () => {
      //gui.viewTrick();
      this.hide(); //hide the extensions manager
      //and all the other extensions:
      Object.keys(this.extensions).map((k) => {
        if (this.extensions[k] != extension) {
          this.extensions[k].hide();
        }
      });
    });

    // extension.on('hide', () => {
    //     if (Object.keys(this.extensions).every((key) => {
    //             return this.extensions[key].isHidden();
    //         }) && this.isHidden()) {
    //     }
    // });

    this.emit('add', extension);

  }

  show() {
    this.hideAll();
    this.sidebar.show();
    super.show();
  }


  hide() {
    if (Object.keys(this.extensions).every((key) => {
        this.extensions[key].isHidden();
      }) && this.isHidden()) {}
    super.hide();
  }






}

module.exports = ExtensionsManager;
