#![cfg_attr(
	all(not(debug_assertions), target_os = "windows"),
	windows_subsystem = "windows"
)]

extern crate midir;
use midir::{MidiOutput, MidiInput, MidiOutputPort, MidiInputPort, MidiOutputConnection, MidiInputConnection};
use std::sync::Mutex;
use std::ops::DerefMut;
use rfd::FileDialog;
use std::fs::File;
use std::io::Read;
use std::io::Write;
use tauri::{Manager,Window};

static CONN: Mutex<Option<MidiOutputConnection>> = Mutex::new(None);
static INPUT_CONN: Mutex<Option<MidiInputConnection<()>>> = Mutex::new(None);

#[tauri::command]
fn send_midi(len: usize, data: [u8; 32]) {

	match CONN.lock() {
		Ok(mut guard) => {

			let v = guard.deref_mut();

			match v {
				Some(c) => {
					c.send(&data[0..len]); ()
				},
				None => ()
			}
		},
		Err(e) => ()	
	};

	//println!("I was invoked from JS, with this message!", );
}

fn recieve_midi()
{

}

#[tauri::command]
fn open_project(name:String) -> String {

	let mut contents = String::new();

	if name != "" {
		let mut file = File::open(&name).unwrap();
		file.read_to_string(&mut contents);

		println!("opening up {}", name);
		return contents;

	}
	else 
	{
		let files = FileDialog::new()
		.add_filter("Project file", &["json"])
		.set_directory("/")
		.pick_file();

		match files {
			Some(buf) => {

				let mut file = File::open(buf).unwrap();
				
				file.read_to_string(&mut contents);
			}
			_ => ()
		}

		return contents
	}
}

#[tauri::command]
fn pick_music_file() -> String {

	let mut contents = String::new();


	let files = FileDialog::new()
		.add_filter("Track", &["mp3","wav","flac","ogg","m4a"])
		.set_directory("/")
		.pick_file();

	match files {
		Some(buf) => return String::from(buf.as_path().to_str().unwrap()),
		_ => return String::from("")
	}
}

#[tauri::command]
fn save_project(data:String) -> Result<(), &'static str> {

	let files = FileDialog::new()
		.add_filter("Project file", &["json"])
		.set_directory("/")
		.save_file();

	match files {
		Some(buf) => {
			
			let mut file = File::create(buf).unwrap();
    		file.write_all(data.as_bytes());
   			Ok(())
		}
		None => Err("no file")
	}
}


fn main() {

	let out = MidiOutput::new("launchpadOUT").expect("reason");

	let launchpad_in = MidiInput::new("launchpadIN").expect("reason");

	println!("Output Ports: ");

	let mut launchpad_outport: Option<MidiOutputPort> = None;

	for port in out.ports() {
		
		let name = out.port_name(&port).expect("port name");
		println!("  Port {:?}", name);

		if name == "MIDIOUT2 (LPX MIDI)" {
			launchpad_outport = Some(port);
		}
	}

	

	match launchpad_outport {
		Some(port) => {

			let mut conn_unwraped = out.connect(&port,"connected to computer").expect("trying to get the connection");
			*CONN.lock().unwrap() = Some(conn_unwraped);

		},
		None => {println!("Could not connet to the Launchpad Port")}

	}

	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![
			send_midi, open_project, save_project, pick_music_file
			])
		.setup(|app| {

			let mut launchpad_inport: Option<MidiInputPort> = None;
			let main_window = app.get_window("main").unwrap();

			println!("Input ports: ");

			for port in launchpad_in.ports() {
				
				let name = launchpad_in.port_name(&port).expect("port name");
				println!("  Port {:?}", name);

				if name == "MIDIIN2 (LPX MIDI)" {
					launchpad_inport = Some(port);
				}
			}

			match launchpad_inport {
				Some(port) => {

					println!("setting up inport");
					let conn = launchpad_in.connect(&port, "connected to input", move |stamp, message, _| {

						println!("{:?}", message);
						main_window.emit("midi", message);

					}, ()).unwrap();

					*INPUT_CONN.lock().unwrap() = Some(conn);


				},
				None => {
					println!("Could not connet to the Launchpad Port");
				}

			};

			Ok(())

		})
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}


