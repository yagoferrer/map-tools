class Template {
  constructor(public that) {
  }

  public load(type, url, cb) {

  if (this.that.templates[type][url]) {
    return this.that.templates[type][url];
  }

  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);

  xhr.onload = () => {

    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        this.that.templates[type][url] = xhr.responseText;
        cb(false, xhr.responseText);
      } else {
        cb(new Error(xhr.statusText));
      }
    }
  };



  xhr.send(null);
}

}

export = Template;
