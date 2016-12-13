function QuestionItem(_id, title, desc, A, B, C, D, ans, tags, checked) {
  this._id = _id;
  this.title = title;
  this.desc = desc;
  this.A = A;
  this.B = B;
  this.C = C;
  this.D = D;
  this.ans = ans;
  this.tags = tags;
  this.checked = !!(checked);
}

function QuestionList() {
  this.questions = []; // List of todo questions
}
function PageNum() {
  this.selectedpage = 0;
  this.pages = 0;
}

$(document)
  .ready(function () {
    var myList = new QuestionList(); // The todo list model
    var pagenum = new PageNum();
    updateView(); // Render the initial view

    $('#Button4').on('click', function (evt) {
      updateModel();

      console.log(pagenum.pages);
      updateView();

    });

    function updateModel() {
      myList.questions = [];
      $.getJSON('/ajax/MC', function (result) {
        $
          .each(result, function (i, item) {
            var question = new QuestionItem(item._id, item.title, item.desc, item.A, item.B, item.C, item.D, item.ans, item.tags);
            myList
              .questions
              .push(question);

          });
        pagenum.pages = Math.ceil(myList.questions.length / 10);
        updateView();
      });

    }
    // These are event handlers for dynamically created elements
    function deleteHandler(evt) {
      var parent = $(this).parent(); // The "li" element containing the current button

      var pos = $('#listpanel a').index(parent); // Determine its position in the "ul"

      if (pos != -1) {
        pos = 10 * pagenum.selectedpage + pos;
        $.post('/ajax/deleteMC', {
          _id: myList.questions[pos]._id
        }, function (result) {
          console.log(myList.questions[pos]._id);
          console.log("delete success");
          console.log(result);
          updateModel();
          var newpages = Math.ceil(myList.questions.length / 10);
          if (newpages != pagenum.pages && newpages != 0 && pagenum.selectedpage == newpages) {
            pagenum.selectedpage = newpages - 1;
          }
          pagenum.pages = newpages;

        });
        // Remove the element at position pos (i.e., update the model)

        updateView();
      }
    }

    function upHandler(evt) {
      var parent = $(this).parent(); // The "li" element containing the current button

      var pos = $('#listpanel a').index(parent); // Determine its position in the "ul"

      if (pos != -1) {
        pos = 10 * pagenum.selectedpage + pos;
        if (pos != 0) {
          var temp = myList.questions[pos];
          myList.questions[pos] = myList.questions[pos - 1];
          myList.questions[pos - 1] = temp;
        }
        updateView();
      }
    }
    function downHandler(evt) {
      var parent = $(this).parent(); // The "li" element containing the current button

      var pos = $('#listpanel a').index(parent); // Determine its position in the "ul"

      if (pos != -1) {
        pos = 10 * pagenum.selectedpage + pos;
        if (pos != myList.questions.length - 1) {
          var temp = myList.questions[pos]
          myList.questions[pos] = myList.questions[pos + 1]
          myList.questions[pos + 1] = temp
        }
        updateView();
      }
    }
    function updateHandler(evt) {
      // Determine its position of the containing "li" element in the  "ul" list.
      var pos = $('#listpanel a').index($(this).parent());
      var dialog,
        form;
      function updateQuestion() {
        var valid = true;
        if (valid) {
          $
            .post('/ajax/updateMC', {
              _id: myList.questions[pos]._id,
              title: $("#title2").val(),
              desc: $("#desc2").val(),
              A: $("#A2").val(),
              B: $("#B2").val(),
              C: $("#C2").val(),
              D: $("#D2").val(),
              ans: $("#ans2").val(),
              tags: $("#tags2").val()
            }, function (result) {
              console.log(result);
              updateModel();
            });
          dialog.dialog("close");
        }
        return valid;
      }
      dialog = $("#updateQuestion").dialog({
        autoOpen: false,
        height: 400,
        width: 400,
        modal: true,
        buttons: {
          "Update a Question": updateQuestion,
          Cancel: function () {
            dialog.dialog("close");
          }
        },
        close: function () {
          form[0].reset();
        }
      });
      $("#updateQuestion").css("visibility", "visible");
      form = dialog
        .find("form")
        .on("submit", function (event) {
          event.preventDefault();
          updateQuestion();
        });
      dialog.dialog("open")
    }

    function showDetail(evt) {
      var pos = $('#listpanel a').index($(this).parent());

      var $id = $('<p>').text("ID:" + myList.questions[pos]._id);
      var $title = $('<h4>').text(myList.questions[pos].title);
      var $desc = $('<p>').text(myList.questions[pos].desc);
      var $ul = $('<ul>');
      var $A = $('<li>').append($('<span>').text("A: " + myList.questions[pos].A));
      var $B = $('<li>').append($('<span>').text("B: " + myList.questions[pos].B));
      var $C = $('<li>').append($('<span>').text("C: " + myList.questions[pos].C));
      var $D = $('<li>').append($('<span>').text("D: " + myList.questions[pos].D));
      $ul
        .append($A)
        .append($B)
        .append($C)
        .append($D);
      console.log($ul);

      var $ans = $('<p>').text("Answer: " + myList.questions[pos].ans);
      var $tags = $('<p>').text("Tags: " + myList.questions[pos].tags);
      var $dialogs = $('#showDetail')
      $dialogs.empty();
      $dialogs
        .append($id)
        .append($title)
        .append($desc)
        .append($ul)
        .append($ans)
        .append($tags);
      console.log($($dialogs));
      $("#showDetail").dialog({
        modal: true,
        buttons: {
          Ok: function () {
            $(this).dialog("close");
          }
        }
      });
      $("#showDetail").css("visibility", "visible");
      $("#showDetail").dialog("open");
    }

    function checkHandler(evt) {
      // Determine its position of the containing "li" element in the  "ul" list.
      var pos = $('#listpanel a').index($(this).parent());
      if (pos != -1) {
        myList.items[pos].checked = $(this).prop('checked');
        updateView();
      }
    }
    function selectPageHandler(evt) {
      var pos = $(this).text() - 1;
      pagenum.selectedpage = pos;
      updateView();

    }
    function updateView() {

      var $pg = $('#page_num_panel');
      $pg.empty()
      console.log(pagenum.pages);
      for (var i = 0; i < pagenum.pages; i++) {
        console.log(2);
        var $page = $('<li>');
        var $num = $('<a>');
        $num.prop('href', "#")
        $num.text(i + 1);
        $num.on('click', selectPageHandler);
        $page.append($num);
        $pg.append($page);
      }
      var $ul = $('#listpanel');
      $ul.empty();
      var s = ((myList.questions.length < 10 * pagenum.selectedpage + 10)
        ? myList.questions.length
        : 10 * pagenum.selectedpage + 10);
      for (var i = 10 * pagenum.selectedpage; i < s; i++) {
        var item = myList.questions[i];
        var $listItem = $('<a>');
        $listItem.addClass("list-group-item");;
        var $chkbox = $('<input type=checkbox>');
        $chkbox.on('change', checkHandler);
        $chkbox.prop('checked', item.checkeded);

        var $title = $('<h4>').text(item.title);
        $title.addClass("list-group-item-heading");
        var $desc = $('<p>').text(item.desc);
        $desc.addClass("list-group-item-text")
        var $button1 = $('<button>').text('\u25B2');
        $button1.on('click', upHandler);
        $button1.button();
        var $button2 = $('<button>').text('\u25BC');
        $button2.on('click', downHandler);
        $button2.button();
        var $button5 = $('<button>').text('Show Detail');
        $button5.on('click', showDetail);
        $button5.button();

        var $button3 = $('<button>').text('Update');
        $button3.button();
        $button3.on('click', updateHandler);

        var $button4 = $('<button>').text('Delete');
        $button4.button();
        $button4.on('click', deleteHandler);

        $listItem
          .append($chkbox)
          .append($title)
          .append($desc)
          .append($button1)
          .append($button2)
          .append($button5)
          .append($button3)
          .append($button4);

        $ul.append($listItem);
      }
    }

  });
// JavaScript Document