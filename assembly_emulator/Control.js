/*
Global variables 
*/

function create_enter_listener(id,func){
	// find the html element with id="..." 
	// this allows us to look at or change properties of this element.
	temp = document.getElementById(id);
	// we add "something" (a "listener") which reacts when the Enter key is pressed
	// When Enter is pressed, the function func will be executed.
	temp.addEventListener('keydown', function onEvent(e) {
		if (e.key === "Enter") {
			func();
		}
	});
}

// This function is such the mobile website also can have similar functionality to the code above
function create_focus_listener(id,func){
	temp = document.getElementById(id);
	document.getElementById(id).addEventListener("focusout",func);
}

function create_button_listener(id,func){
	document.getElementById(id).addEventListener("click",func);
}

function press_assemble(){
	_start = 0;
	clearInterval(asm);
	clear_hardware();
	get_text();
	parse_code();
	clear_print_table()
}

function press_step(){
	if(_start==0){
		iterate();
	}
	else{
		_start = 0;
		clearInterval(asm);
	}
}

function press_run(){
	if(_start==0){
		asm = setInterval(iterate,_delay*1000);
		_start=1;
	}
	else{
		_start = 0;
		clearInterval(asm);
	}
}

function set_speed(){
	var temp = document.getElementById("speed"); 
	_delay = 1/temp.value;
	if (_start!=0){
		clearInterval(asm);
		gol = setInterval(iterate,_delay*1000);
	}
}

const printer = "; Simple example\n"+
"; Writes Hello World to the output\n"+
"\n"+
"	JMP start\n"+
"hello: DB \"Hello World!\" ; Variable\n"+
"       DB 0	; String terminator\n"+
"\n"+
"start: \n"+
"	MOV C, hello    ; Point to var \n"+
"	MOV D, 232	; Point to output\n"+
"	CALL print\n"+
"        HLT             ; Stop execution\n"+
"\n"+
"print:			; print(C:*from, D:*to)\n"+
"	PUSH A\n"+
"	PUSH B\n"+
"	MOV B, 0\n"+
".loop:\n"+
"	MOV A, [C]	; Get char from var\n"+
"	MOV [D], A	; Write to output\n"+
"	INC C\n"+
"	INC D\n"+
"	CMP B, [C]	; Check if end\n"+
"	JNZ .loop	; jump if not\n"+
"\n"+
"	POP B\n"+
"	POP A\n"+
"	RET";

function create_ram_table(mat,ncol){
	var elem = document.getElementById('ram');
	var row;
	for(var i=0;i<mat.length;i++){
		if(i%ncol==0){
			row = document.createElement('tr');
		}
		var col = document.createElement('td');
		col.setAttribute('class','byte');
		col.style.width = (100/ncol).toString()+"%";
		col.setAttribute('id',"ram_"+(i).toString());
		var txt = document.createTextNode(("00"+mat[i].toString(16)).slice(-2));
		col.appendChild(txt);
		row.appendChild(col);
		if(i%ncol==0){
			elem.appendChild(row);
		}
	}
}

function create_print_table(mat,ncol){
	var parent = document.getElementById('print');
	var elem = document.getElementById('print');
	var row;
	for(var i=0;i<mat.length;i++){
		if(i%ncol==0){
			row = document.createElement('tr');
		}
		var col = document.createElement('td');
		col.setAttribute('class','byte');
		col.style.width = (100/ncol).toString()+"%";
		col.setAttribute('id',"print_"+(i).toString());
		if(mat[i]==0){
			var txt = document.createTextNode("\u00A0");
			col.appendChild(txt);
		}
		else{
			var txt = document.createTextNode(String.fromCharCode(mat[i]));
			col.appendChild(txt);
		}
		row.appendChild(col);
		if(i%ncol==0){
			elem.appendChild(row);
		}
	}
}

function clear_hardware(){
	_memory = new Uint8Array(_memory.length);
	for(var i=0;i<_memory.length;i++){
		var elem = document.getElementById('ram_'+i.toString());
		elem.setAttribute("class","byte");
		memory_screen(0,i);
	}
	_registers = new Uint8Array(_registers.length);
	for(var i=0;i<_registers.length;i++){
		register_screen(0,i);
	}
}

function clear_print_table(){
	for(var i=0;i<_printl;i++){
		var elem = document.getElementById('print_'+i.toString());
		var loc = i+_printl-_memory.length;
		var txt;
		if(loc>=0){
			var val = _memory[loc];
			if(val<=32){
				txt = "\u00A0";
			}
			else{
				txt = String.fromCharCode(val);
			}
		}
		else{
			txt = "\u00A0";
		}
		elem.textContent = txt;
	}
}

function create_register_table(mat){
	var elem = document.getElementById('register');
	for (var i=0;i<2;i++){
		var row = document.createElement('tr');
		for(var j=0;j<mat[i].length;j++){
			var col = document.createElement('td');
			if(i==0){
				col.setAttribute('class','title');
			}
			else{
				col.setAttribute('class','byte');
				col.setAttribute('id',mat[0][j]);
			}
			col.style.width = (100/mat[i].length).toString()+"%";
			var txt = document.createTextNode(mat[i][j]);
			col.appendChild(txt);
			row.appendChild(col);
		}
		elem.appendChild(row);
	}
}

function create_label_table(names){
	var parent = document.getElementById('labeltable');
	var elem = document.createElement('table');
	elem.setAttribute('id',"labels");
	var row = document.createElement('tr');
	for (var i=0;i<names.length;i++){
		var col = document.createElement('td');
		col.style.width = (100/names.length).toString()+"%";
		col.setAttribute('class','title');
		var txt = document.createTextNode(names[i]);
		col.appendChild(txt);
		row.appendChild(col);
	}
	elem.appendChild(row);
	parent.appendChild(elem);
}

function fill_label_table(lookuptable,memory){
	var parent = document.getElementById('labels');
	while (parent.childNodes.length>1) {  
		parent.removeChild(parent.lastChild);
	}
	var temp = Object.keys(lookuptable);
	var sorted_keys = Array.from(lookuptable.keys()).sort();
	for(var i=0;i<sorted_keys.length; i++){
		var row = document.createElement('tr');
		var col = document.createElement('td');
		col.style.width = (100/3).toString()+"%";
		col.setAttribute('class','byte');
		var txt = document.createTextNode(sorted_keys[i]);
		col.appendChild(txt);
		row.appendChild(col);
		var col = document.createElement('td');
		col.style.width = (100/3).toString()+"%";
		col.setAttribute('class','address byte');
		var content = ("00"+lookuptable.get(sorted_keys[i]).toString(16)).slice(-2);
		var txt = document.createTextNode(content);
		col.appendChild(txt);
		row.appendChild(col);
		var col = document.createElement('td');
		col.style.width = (100/3).toString()+"%";
		col.setAttribute('class','byte');
		content = ("00"+memory[lookuptable.get(sorted_keys[i])].toString(16)).slice(-2);
		var txt = document.createTextNode(content);
		col.appendChild(txt);
		row.appendChild(col);
		parent.appendChild(row);
		var mem = document.getElementById('ram_'+lookuptable.get(sorted_keys[i]).toString());
		mem.setAttribute('class','address byte');
	}
}

function color_instruction(commands){
	for(var i=0;i<commands.length; i++){
		var mem = document.getElementById('ram_'+commands[i].toString());
		mem.setAttribute('class','command byte');
	}
}

function color_ip(loc){
	var mem = document.getElementById('ram_'+loc.toString());
	mem.setAttribute('class',mem.getAttribute('class')+" instruction");
	if(_line_numbers.has(loc)){
		text_line(_line_numbers.get(loc));
	}
}

function uncolor_ip(loc){
	var mem = document.getElementById('ram_'+loc.toString());
	mem.setAttribute('class',mem.getAttribute('class').slice(0,-12));
}

function color_sp(loc){
	var mem = document.getElementById('ram_'+loc.toString());
	mem.setAttribute('class',mem.getAttribute('class')+" stackpointer");
}

function uncolor_sp(loc){
	var mem = document.getElementById('ram_'+loc.toString());
	mem.setAttribute('class',mem.getAttribute('class').slice(0,-13));
}

function set_code(text){
	document.getElementById('code').value = text;
}

function get_text(){
	_text = document.getElementById('code').value;
}

function clear_error(){
	document.getElementById('error').textContent = "";
}

function set_error(text){
	document.getElementById('error').textContent = text;
}

function memory_screen(val,loc){
	var txt = ("00"+val.toString(16)).slice(-2);
	document.getElementById('ram_'+loc.toString()).textContent = txt;
	if(loc>=_memory.length-_printl){
		if(val==0 || val==32){
			txt = "\u00A0";
			var elem = document.getElementById('print_'+(loc+_printl-_memory.length).toString());
			elem.textContent = txt;
		}
		else{
			var elem = document.getElementById('print_'+(loc+_printl-_memory.length).toString());
			elem.textContent = String.fromCharCode(val);
		}
	}
}

function register_screen(val,loc){
	var txt = ("00"+val.toString(16)).slice(-2);
	if(loc<4){
		document.getElementById(String.fromCharCode(loc+65)).textContent = txt;
	}
	else if(loc==SP){
		document.getElementById('SP').textContent = txt;
	}
	else if(loc==IP){
		document.getElementById('IP').textContent = txt;
	}
	else if(loc==ZERO){
		if(val!=0){
			document.getElementById('Z').textContent = "True";
		}
		else{
			document.getElementById('Z').textContent = "False";
		}
	}
	else if(loc==CARRY){
		if(val!=0){
			document.getElementById('CA').textContent = "True";
		}
		else{
			document.getElementById('CA').textContent = "False";
		}
	}
}

function text_line(n){
	var elem = document.getElementById('code');
	elem.focus();
	var ind = n[1]
	elem.selectionStart = ind;
	elem.selectionEnd = ind+_lines[n[0]].length;
}