const layout = {
  rows: [{
      view: "template",
      template: "<h1>Прайс-лист</h1>",
      height: 70
    },
    {
      cols: [{
          view: "tree",
          //width: 250,
          id: "Folders",
          select: true,
          gravity: 0.1,
          data: []
        },
        {
          view: "resizer"
        },
        {
          view: "datatable",
          id: "List",
          //width: 700,
          select: true,
          gravity: 0.5,
          columns: [{
              id: "title",
              header: "Наименование",
              fillspace: true
            },
            {
              id: "sku",
              header: "Артикул",
              width: 100,
              css: {
                'text-align': 'center'
              }
            },
            {
              id: "unit",
              header: "Ед. изм.",
              width: 80,
              css: {
                'text-align': 'center'
              }
            },
            {
              id: "rest",
              header: "Остаток",
              width: 80,
              css: {
                'text-align': 'right'
              }
            },
            {
              id: "price",
              header: "Цена без НДС",
              width: 100,
              css: {
                'text-align': 'right'
              },
              format: function (value) {
                return webix.i18n.numberFormat(value)
              }
            },
            {
              id: "priceVAT",
              header: "Цена с НДС",
              width: 100,
              css: {
                'text-align': 'right'
              },
              format: function (value) {
                return webix.i18n.numberFormat(value)
              }
            }
          ],
          data: []
        },
        {
          view: "resizer"
        },
        {
          gravity: 0.4,
          rows: [{
              view: "carousel",
              id: "Thumbnail",
              css: "thumbnail",
              cols: []
            },
            {
              view: "dataview",
              id: "ImageList",
              css: "nav_list",
              yCount: 1, // one row
              select: true, // item selection enabled
              scroll: false, // non-scrollable
              type: {
                width: 100,
                height: 65
              },
              template: img,
              data: []
            }
          ]
        }
      ]
    }
  ]
}

function img(obj) {
  return "<div style='background-image: url(\"offers/img/" + obj.img + "\");' class='content'></div>";
}

function render() {
  webix.ui(
    layout
  );

  const paths = window.location.pathname.split("/");
  var offerId = paths[2];

  var folders = $$("Folders");
  folders.load("folders?offerId=" + offerId, "json");

  var list = $$("List");
  list.load("items?offerId=" + offerId, "json");

  folders.attachEvent("onAfterLoad", function () {
    folders.openAll();
    selectFirstItem(folders);
  });

  list.attachEvent("onAfterLoad", function () {
    selectFirstItem(list);
  });

  var imageList = $$("ImageList");
  
  

  var thumbnail = $$("Thumbnail");
  thumbnail.attachEvent("onShow", function (id) {
    imageList.select(id);
  });

  folders.attachEvent("onSelectChange", function () {
    var item = folders.getSelectedItem(false);
    const parents = [];
    parents.push(item.id);
    if (folders.isBranch(item.id)) {
      folders.data.each(
        function (obj) {
          parents.push(obj.id);
        }, this, true, item.id);
    }
    list.filter(function (obj) {
      if(parents.includes(obj.parentId)) {
        return true;
      } else {
        return false;
      }
    });

    selectFirstItem(list);
  });

  list.attachEvent("onSelectChange", function () {
    var item = list.getSelectedItem(false);
    if (item) {
      imageList.filter(function (obj) {
        return obj.itemId === item.id;
      });
    } 

    const ids = [];
    for (let i = 0; i < thumbnail._cells.length; i++) {
      ids.push(thumbnail._cells[i].config.id);
    }
    for (let i = 0; i < ids.length; i++) {
      try {
        thumbnail.removeView(ids[i]);
      } catch (err) {
        //console.log(err);
      }
    }
    imageList.clearAll();
    if (item) {
      imageList.load("images?offerId=" + offerId + "&itemId=" + item.id, "json", function() {
        fillImageList(imageList, thumbnail);
        selectFirstItem(imageList);
        showThumbnail(imageList);
      });
    }
  });

  imageList.attachEvent("onSelectChange", function () {
    showThumbnail(imageList);
  });
}

function selectFirstItem(list) {
  const firstId = list.getFirstId();
  if (firstId) {
    list.select(firstId);
  } else {
    console.log(list.config.id);
  }
}

function showThumbnail(imageList) {
  const item = imageList.getSelectedItem(false);
  if(item) {
    const cell = $$(item.id);
    if(cell) {
      cell.show();
    }
  }
}

function fillImageList(imageList, thumbnail) {
  imageList.data.each(function (data) {
    thumbnail.addView({
      id: data.id,
      css: "image",
      template: img,
      data: webix.copy(data)
    });
  });
}