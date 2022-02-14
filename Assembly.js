/*
Global variables 
*/

// Use https://www.debuggex.com/
// regex strings
const REGEX = /^\s*(?:([.A-Za-z]\w*)[:])?(?:\s*([A-Za-z]{2,4})(?:\s+(\[(\w+((\+|-)\d+)?)\]|\".+?\"|\'.+?\'|[.A-Za-z0-9]\w*)(?:\s*[,]\s*(\[(\w+((\+|-)\d+)?)\]|\".+?\"|\'.+?\'|[.A-Za-z0-9]\w*))?)?)?/;
const REGEXLABEL = /\s*[.A-Za-z]\w*:/;
const REGEXREGISTER = /^((?:[abcdABCD])|(?:[sS][pP]))$/;
const REGEXREGADDRESS = /^\[([abcdABCD]|[sS][pP])([+-][0-9]+)?\]$/;
const REGEXADDRESS = /^\[([.A-Za-z]\w*|[0-9]+)\]$/;
const REGEXNUMBER = /^[-+]?(?:(?:0[xo])?[0-9]+|[0-9]+[bd]?)$/;
const REGEXCOMMENT = /^\s*(;.*)?$/;
const LABELCOMMENT = /^\s*(?:([.A-Za-z]\w*)[:])\s*(;.*)?$/;

const ERR = -1;
const REG = 0;
const ADD = 1;
const REGADD = 2;
const NUM = 3;

// address offset error
const AOE = -1;
// register name error;
const RNE = -2;
// number range error
const NRE = -3;
// label missing error
const LME = -4;
// operand argument error
const OAE = -5;
// unkown operation error
const UOE = -6;
// ascii character error
const ACE = -7;

const SP = 4;
const IP = 5;
const ZERO = 6;
const CARRY = 7;


lookup = new Map();

// counter to get opcodes
var c = 0;
// collection of all op codes
var opcodes = new Map();
opcodes.set('NONE',c++);
opcodes.set('MOV_R2R',c++);
opcodes.set('MOV_R2A',c++);
opcodes.set('MOV_R2RA',c++);
opcodes.set('MOV_A2R',c++);
opcodes.set('MOV_RA2R',c++);
opcodes.set('MOV_R2N',c++);
opcodes.set('MOV_A2N',c++);
opcodes.set('MOV_RA2N',c++);
opcodes.set('ADD_R2R',c++);
opcodes.set('ADD_A2R',c++);
opcodes.set('ADD_N2R',c++);
opcodes.set('INC_R',c++);
opcodes.set('DEC_R',c++);
opcodes.set('CMP_R2R',c++);
opcodes.set('CMP_R2RA',c++);
opcodes.set('CMP_R2A',c++);
opcodes.set('CMP_R2N',c++);
opcodes.set('JMP_RA',c++);
opcodes.set('JMP_N',c++);
opcodes.set('JC_RA',c++);
opcodes.set('JC_A',c++);
opcodes.set('JNC_RA',c++);
opcodes.set('JNC_A',c++);
opcodes.set('JNZ_RA',c++);
opcodes.set('JNZ_N',c++);
opcodes.set('JZ_RA',c++);
opcodes.set('JZ_N',c++);
opcodes.set('JA_RA',c++);
opcodes.set('JA_N',c++);
opcodes.set('JBE_RA',c++);
opcodes.set('JBE_N',c++);
opcodes.set('JNA_RA',c++);
opcodes.set('JNA_N',c++);
opcodes.set('PUSH_R',c++);
opcodes.set('PUSH_RA',c++);
opcodes.set('PUSH_A',c++);
opcodes.set('PUSH_N',c++);
opcodes.set('POP_R',c++);
opcodes.set('CALL_R',c++);
opcodes.set('CALL_N',c++);
opcodes.set('RET',c++);
opcodes.set('MUL_R',c++);
opcodes.set('MUL_RA',c++);
opcodes.set('MUL_A',c++);
opcodes.set('MUL_N',c++);
opcodes.set('DIV_R',c++);
opcodes.set('DIV_RA',c++);
opcodes.set('DIV_A',c++);
opcodes.set('DIV_N',c++);
opcodes.set('AND_R2R',c++);
opcodes.set('AND_RA2R',c++);
opcodes.set('AND_A2R',c++);
opcodes.set('AND_N2R',c++);
opcodes.set('OR_R2R',c++);
opcodes.set('OR_RA2R',c++);
opcodes.set('OR_A2R',c++);
opcodes.set('OR_N2R',c++);
opcodes.set('XOR_R2R',c++);
opcodes.set('XOR_RA2R',c++);
opcodes.set('XOR_A2R',c++);
opcodes.set('XOR_N2R',c++);
opcodes.set('NOT_R',c++);
opcodes.set('SHL_R2R',c++);
opcodes.set('SHL_RA2R',c++);
opcodes.set('SHL_A2R',c++);
opcodes.set('SHL_N2R',c++);
opcodes.set('SHR_R2R',c++);
opcodes.set('SHR_RA2R',c++);
opcodes.set('SHR_A2R',c++);
opcodes.set('SHR_N2R',c++);
console.log(opcodes);

var _memory = new Uint8Array(256);
var _registers = new Uint8Array(9);
var _printl = 24;
var _lookup = new Map();
var _delay = 0.25;
var _text;
var _lines;
var _line_numbers;
var _start = 0;
var asm;

function initiate(){
	create_print_table(new Uint8Array(_printl),_printl);
	create_register_table([["A","B","C","D","IP","SP","Z","CA","F"],["00","00","00","00","00","00","False","False","False"]]);
	create_ram_table(_memory,16);
	create_label_table(["Name","Address","Value"]);
	set_code(printer);
	create_button_listener("assemble",press_assemble);
	create_button_listener("step",press_step);
	create_button_listener("run",press_run);
	create_enter_listener("speed",set_speed);
	create_focus_listener("speed",set_speed);
	var temp = document.getElementById("speed");
	temp.value = 1/_delay;
}

function parse_code(){
	// split the input text into individual lines
	_lines = _text.split("\n");
	// loopup table for label names
	lookup = new Map();
	// collection of all operations used
	var operations = [];
	_line_numbers = new Map();
	var command_loc = [];
	// counter for the current address in code
	// increases when operation and operands are added.
	var counter = 0;
	var charcounter = 0;
	// first round: get all address labels and addresses and extract operation lines
	// this should also weed out a lot of syntax errors
	for(var i=0; i<_lines.length;i++){
		var label = _lines[i].match(REGEX);
		var l = operations.length;
		console.log(label);
		// line contains a label
		if(label[1]!=null){
			if(!REGEXREGISTER.test(label[1])){
				lookup.set(label[1],counter);
				// check if there is a label after the comment
				if(label[2]==null){
					if(!LABELCOMMENT.test(_lines[i])){
						set_error(i.toString()+" | syntax error (after label)");
						return -1;
					}
				}
			}
			else {
				set_error(i.toString()+" | label reserved for register");
				return -1;
			}
		}
		if(label[2]!=null){
			operations.push([]);
			_line_numbers.set(counter,[i,charcounter]);
			operations[l].push(label[2]);
			counter++;
		}
		if(label[3]!=null){
			if(label[2]=="DB"){
				if(label[3][0]=='"' || label[3][0]=="'"){
					operations[l].push(label[3]);
					counter+=label[3].length-3;
				}
				else{
					operations[l].push(label[3]);
				}
			}
			else{
				operations[l].push(label[3]);
				counter++;
			}
		}
		if(label[7]!=null){
			operations[l].push(label[7]);
			counter++;
		}
		if(label[0]==""){
			if(!REGEXCOMMENT.test(_lines[i])){
				set_error(i.toString()+" | syntax error");
				return -1;
			}
		}
		charcounter+=_lines[i].length+1;
	}
	
	counter = 0;
	for(var i=0;i<operations.length;i++){
		var inc = parse_operation(operations[i],counter);
		console.log(inc);
		if(inc<0){
			
		}
		else{
			if(operations[i][0].toUpperCase()!="DB"){
				command_loc.push(counter);
			}
			counter+=inc;
		}
	}
	console.log(_memory);
	console.log(command_loc);
	console.log(operations);
	console.log(lookup);
	color_instruction(command_loc);
	fill_label_table(lookup,_memory);
	color_ip(0);
	_registers[SP] = _memory.length-1-_printl;
	color_sp(_registers[SP]);
	register_screen(_registers[SP],SP);
	return lookup;
}

function parse_operation(op,loc){
	var optype = op[0].toUpperCase();
	switch(optype){
		case "HLT":
			return 1;
		case "DB":
			if(op[1]==null){
				return ACE;
			}
			else if(op[1][0]=='"' || op[1][0]=="'"){
				for(var i=1;i<op[1].length-1;i++){
					var chr = op[1][i].charCodeAt();
					if(chr>255){
						return ACE;
					}
					_memory[loc+i-1] = chr;
					memory_screen(chr,loc+i-1);
				}
				return op[1].length-2;
			}
			else{
				var chr = label_number(op[1]);
				if(chr<0){
					return chr;
				}
				_memory[loc] = chr;
				memory_screen(_memory[loc],loc);
				return 1;
			}
		case "CMP":
			var name = name_mix(op,optype);
			return memory_write(op,name,loc);
		case "JMP":
			var name = single_name(op,optype);
			return memory_write(op,name,loc);
		case "JZ":
			var name = single_name(op,optype);
			return memory_write(op,name,loc);
		case "JNZ":
			var name = single_name(op,optype);
			return memory_write(op,name,loc);
		case "JBE":
			var name = single_name(op,optype);
			return memory_write(op,name,loc);
		case "MOV":
			var name = name_mix(op,optype);
			return memory_write(op,name,loc);
		case "INC":
			var name = single_name(op,optype);
			return memory_write(op,name,loc);
		case "PUSH":
			var name = single_name(op,optype);
			return memory_write(op,name,loc);
		case "POP":
			var name = single_name(op,optype);
			return memory_write(op,name,loc);
		case "CALL":
			var name = single_name(op,optype);
			return memory_write(op,name,loc);
		case "RET":
			_memory[loc] = opcodes.get(optype);
			memory_screen(_memory[loc],loc);
			return 1;
		default:
			return UOE;
	}
}

function name_mix(op,name){
	var app = "_";
	for(var i=1;i<op.length;i++){
		app+=type_string(op[i]);
	}
	return name+app.slice(0,-1);
}

function single_name(op,name){
	return name+"_"+type_string(op[1]).slice(0,-1);
}

function type_string(op){
	switch(operand_type(op)){
		case REG:
			return "R2";
		case ADD:
			return "A2";
		case REGADD:
			return "RA2";
		case NUM:
			return "N2";
		default:
			return "";
	}
}

function memory_write(op,name,loc){
	var l = 0;
	if(opcodes.has(name)){
		console.log(name);
		_memory[loc] = opcodes.get(name);
		memory_screen(_memory[loc],loc);
		l++;
	}
	else{
		return OAE;
	}
	for(var i=1;i<op.length;i++){
		var opnum = translate_op(op[i],operand_type(op[i]));
		if(opnum>=0){
			_memory[loc+i] = opnum;
			memory_screen(_memory[loc+i],loc+i);
			l++;
		}
		else{
			return opnum;
		}
	}
	return l;
}

function translate_op(op,t){
	if(t==REG){
		var test = op.match(REGEXREGISTER)[1].toUpperCase();
		return register_number(test);
	}
	else if(t==REGADD){
		var test = op.match(REGEXREGADDRESS);
		var v = register_number(test[1].toUpperCase());
		if(test[2]!=null){
			var n = parseInt(test[2]);
			if(n<-16 || n>15){
				return AOE;
			}
			v+=256+8*n;
			v%=256;
		}
		return v;
	}
	else if(t==ADD){
		var test = op.match(REGEXADDRESS)[1];
		return label_number(test);
	}
	else {
		return label_number(op);
	}
}

function register_number(test){
	if(test=='SP'){
		return 4;
	}
	var n = test.charCodeAt(0)-65;
	if(n<0 || n>3){
		return RNE;
	}
	return n;
}

function label_number(test){
	if(REGEXNUMBER.test(test)){
		var n = parseInt(test);
		if(n<0 || n>255){
			return NRE;
		}
		return n;
	}
	else if(lookup.has(test)){
		return lookup.get(test);
	}
	return LME;
}

function operand_type(operand){
	if(REGEXREGISTER.test(operand)){
		return REG;
	}
	else if(REGEXREGADDRESS.test(operand)){
		return REGADD;
	}
	else if(operand[0]=="[" ){
		return ADD;
	}
	else if(REGEXNUMBER.test(operand)|| lookup.has(operand)){
		return NUM;
	}
	else{
		return ERR;
	}
}

function run(){
	for(var i=0;i<86;i++){
		var temp = iterate();
	}
}

function iterate(){
	var ip = _registers[IP];
	var instr = _memory[ip];
	console.log(opcodes.get("JMP_N"));
	console.log(instr);
	switch(instr){
		case opcodes.get("NONE"):
			_start = 0;
			clearInterval(asm);
			return "finished";
		case opcodes.get("MOV_R2R"):
			_registers[_memory[ip+1]] = _registers[_memory[ip+2]];
			register_screen(_registers[_memory[ip+1]],_memory[ip+1]);
			_registers[IP]+=3;
			break;
		case opcodes.get("MOV_R2RA"):
			_registers[_memory[ip+1]] = _memory[reg_val(_memory[ip+2])];
			register_screen(_registers[_memory[ip+1]],_memory[ip+1]);
			_registers[IP]+=3;
			break;
		case opcodes.get("MOV_R2N"):
			_registers[_memory[ip+1]] = _memory[ip+2];
			register_screen(_registers[_memory[ip+1]],_memory[ip+1]);
			_registers[IP]+=3;
			break;
		case opcodes.get("MOV_RA2R"):
			_memory[reg_val(_memory[ip+1])] = _registers[_memory[ip+2]];
			memory_screen(_memory[reg_val(_memory[ip+1])] ,reg_val(_memory[ip+1]));
			_registers[IP]+=3;
			break;
		case opcodes.get("INC_R"):
			_registers[_memory[ip+1]]++;
			register_screen(_registers[_memory[ip+1]],_memory[ip+1]);
			_registers[IP]+=2;
			break;
		case opcodes.get('CMP_R2RA'):
			var val = _registers[_memory[ip+1]]-_memory[reg_val(_memory[ip+2])];
			cmp(val);
			break;
		case opcodes.get('CMP_R2N'):
			var val = _registers[_memory[ip+1]]-_memory[ip+2];
			cmp(val);
			break;
		case opcodes.get("JMP_N"):
			jmp(true,ip)
			break;
		case opcodes.get('JNZ_N'):
			jmp(_registers[ZERO]==0,ip)
			break;
		case opcodes.get('JZ_N'):
			jmp(_registers[ZERO]!=0,ip)
			break;
		case opcodes.get('JBE_N'):
			jmp(_registers[ZERO]!=0||_registers[CARRY]!=0,ip)
			break;
		case opcodes.get("PUSH_R"):
			_memory[_registers[SP]] = _registers[_memory[ip+1]];
			memory_screen(_memory[_registers[SP]] ,_registers[SP]);
			uncolor_sp(_registers[SP]);
			_registers[SP]--;
			color_sp(_registers[SP]);
			register_screen(_registers[SP],SP);
			_registers[IP]+=2;
			break;
		case opcodes.get("POP_R"):
			uncolor_sp(_registers[SP]);
			_registers[SP]++;
			color_sp(_registers[SP]);
			register_screen(_registers[SP],SP);
			_registers[_memory[ip+1]] = _memory[_registers[SP]];
			register_screen(_registers[_memory[ip+1]],_memory[ip+1]);
			_registers[IP]+=2;
			break;
		case opcodes.get("CALL_N"):
			_registers[IP] = _memory[ip+1];
			_memory[_registers[SP]] = ip+2;
			memory_screen(_memory[_registers[SP]] ,_registers[SP]);
			uncolor_sp(_registers[SP]);
			_registers[SP]--;
			color_sp(_registers[SP]);
			register_screen(_registers[SP],SP);
			break;
		case opcodes.get("RET"):
			uncolor_sp(_registers[SP]);
			_registers[SP]++;
			color_sp(_registers[SP]);
			register_screen(_registers[SP],SP);
			_registers[IP] = _memory[_registers[SP]];
			break;
		default:
			_start = 0;
			clearInterval(asm);
			return "unkown operation error";
	}
	uncolor_ip(ip);
	color_ip(_registers[IP]);
	register_screen(_registers[IP],IP);
	return "";
}

function reg_val(val){
	var offset = parseInt(val/8);
	if(offset>15){
		offset-=32;
	}
	var reg = val%8;
	return _registers[reg]+offset;
}

function cmp(val){
	if(val==0){
		_registers[ZERO] = 1;
	}
	else{
		_registers[ZERO] = 0;
	}
	if(val<0){
		_registers[CARRY] = 1;
	}
	else{
		_registers[CARRY] = 0;
	}
	register_screen(_registers[ZERO],ZERO);
	register_screen(_registers[CARRY],CARRY);
	_registers[IP]+=3;
}

function jmp(statement,ip){
	if(statement){
		_registers[IP] = _memory[ip+1];
	}
	else{
		_registers[IP]+=2;
	}
}