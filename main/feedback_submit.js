function submit () {
    var name = document.getElementById("name").value;
    var feedback = document.getElementById("feedback").value;
    var f = {name: name, feedback: feedback}
    window.location.href += "/send/" + JSON.stringify(f)
}