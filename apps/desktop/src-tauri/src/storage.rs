use std::{
    fs,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

const CURRENT_FILE: &str = "current.json";
const REVISIONS_DIR: &str = "revisions";
const MAX_REVISIONS: usize = 12;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RevisionEntry {
    id: String,
    saved_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PersistedEnvelope {
    document: serde_json::Value,
    selected_section_id: Option<String>,
    saved_at: String,
    revisions: Vec<RevisionEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveDocumentPayload {
    document: serde_json::Value,
    selected_section_id: Option<String>,
    saved_at: String,
    revision: RevisionEntry,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PersistenceMetadata {
    runtime: String,
    saved_at: String,
    revisions: Vec<RevisionEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentFileContents {
    path: String,
    content: String,
}

fn data_root(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("resume-store");

    fs::create_dir_all(root.join(REVISIONS_DIR)).map_err(|error| error.to_string())?;
    Ok(root)
}

fn read_envelope(path: &Path) -> Result<Option<PersistedEnvelope>, String> {
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let envelope = serde_json::from_str::<PersistedEnvelope>(&content).map_err(|error| error.to_string())?;
    Ok(Some(envelope))
}

fn prune_revisions(revisions_dir: &Path) -> Result<(), String> {
    let mut entries = fs::read_dir(revisions_dir)
        .map_err(|error| error.to_string())?
        .filter_map(Result::ok)
        .collect::<Vec<_>>();

    entries.sort_by_key(|entry| entry.file_name());

    if entries.len() <= MAX_REVISIONS {
        return Ok(());
    }

    let to_remove = entries.len() - MAX_REVISIONS;

    for entry in entries.into_iter().take(to_remove) {
        fs::remove_file(entry.path()).map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn ensure_document_extension(path: PathBuf) -> PathBuf {
    let Some(file_name) = path.file_name().and_then(|name| name.to_str()) else {
        return path;
    };

    if file_name.to_ascii_lowercase().ends_with(".cvcreator.json") {
        return path;
    }

    let updated_name = if file_name.to_ascii_lowercase().ends_with(".json") {
        format!("{}{}.json", file_name.trim_end_matches(".json"), ".cvcreator")
    } else {
        format!("{}{}", file_name, ".cvcreator.json")
    };

    path.with_file_name(updated_name)
}

fn write_document_path(path: &Path, content: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::write(path, content).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn read_document_file(path: String) -> Result<String, String> {
    fs::read_to_string(PathBuf::from(path)).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn write_document_file(path: String, content: String) -> Result<(), String> {
    let path_buf = PathBuf::from(path);
    write_document_path(&path_buf, &content)
}

#[tauri::command]
pub fn open_document_file(app: AppHandle) -> Result<Option<DocumentFileContents>, String> {
    let file_path = app
        .dialog()
        .file()
        .add_filter("CVCreator documents", &["json"])
        .set_title("Load CV")
        .blocking_pick_file();

    let Some(file_path) = file_path else {
        return Ok(None);
    };

    let path = file_path
        .into_path()
        .map_err(|error| error.to_string())?;
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;

    Ok(Some(DocumentFileContents {
        path: path.to_string_lossy().into_owned(),
        content,
    }))
}

#[tauri::command]
pub fn save_document_file(
    app: AppHandle,
    current_path: Option<String>,
    suggested_name: String,
    content: String,
) -> Result<Option<String>, String> {
    if let Some(current_path) = current_path {
        let path = PathBuf::from(current_path);
        write_document_path(&path, &content)?;
        return Ok(Some(path.to_string_lossy().into_owned()));
    }

    let file_path = app
        .dialog()
        .file()
        .add_filter("CVCreator documents", &["json"])
        .set_title("Save CV")
        .set_file_name(suggested_name)
        .blocking_save_file();

    let Some(file_path) = file_path else {
        return Ok(None);
    };

    let selected_path = ensure_document_extension(
        file_path
            .into_path()
            .map_err(|error| error.to_string())?,
    );

    write_document_path(&selected_path, &content)?;

    Ok(Some(selected_path.to_string_lossy().into_owned()))
}

#[tauri::command]
pub fn load_document(app: AppHandle) -> Result<Option<PersistedEnvelope>, String> {
    let root = data_root(&app)?;
    read_envelope(&root.join(CURRENT_FILE))
}

#[tauri::command]
pub fn save_document(app: AppHandle, payload: SaveDocumentPayload) -> Result<PersistenceMetadata, String> {
    let root = data_root(&app)?;
    let current_path = root.join(CURRENT_FILE);
    let revisions_dir = root.join(REVISIONS_DIR);

    let existing_revisions = read_envelope(&current_path)?
        .map(|envelope| envelope.revisions)
        .unwrap_or_default();

    let revisions = std::iter::once(payload.revision.clone())
        .chain(existing_revisions.into_iter())
        .take(MAX_REVISIONS)
        .collect::<Vec<_>>();

    let envelope = PersistedEnvelope {
        document: payload.document,
        selected_section_id: payload.selected_section_id,
        saved_at: payload.saved_at.clone(),
        revisions: revisions.clone(),
    };

    let serialized = serde_json::to_string_pretty(&envelope).map_err(|error| error.to_string())?;
    fs::write(&current_path, serialized).map_err(|error| error.to_string())?;

    let revision_path = revisions_dir.join(format!("{}.json", payload.revision.saved_at.replace(':', "-")));
    fs::write(
        revision_path,
        serde_json::to_string_pretty(&envelope).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())?;

    prune_revisions(&revisions_dir)?;

    Ok(PersistenceMetadata {
        runtime: "tauri".into(),
        saved_at: payload.saved_at,
        revisions,
    })
}
