#!/bin/bash
#
# Script to create backup of folder from given source to given destination
# Pattern of backup FOLDER_NAME-ddmmYYYY-HHMMSS
# Keeps maximum of 7 backups, oldest is deleted
# Example usage for cron: 0 2 * * * /home/developer/deploydash/dbbackup.sh /home/developer/deploydash/db/data /home/developer/deploydash/db/backup
#

# Check if the correct number of arguments is provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <source_folder> <destination_directory>"
  exit 1
fi

SOURCE_FOLDER=$1
DESTINATION_DIRECTORY=$2

# Check if the source folder exists
if [ ! -d "$SOURCE_FOLDER" ]; then
  echo "Error: Source folder '$SOURCE_FOLDER' does not exist."
  exit 1
fi

# Check if the destination directory exists, create it if not
if [ ! -d "$DESTINATION_DIRECTORY" ]; then
  echo "Destination directory '$DESTINATION_DIRECTORY' does not exist. Creating it..."
  mkdir -p "$DESTINATION_DIRECTORY"
fi

# Get the name of the source folder (basename)
BASE_FOLDER_NAME=$(basename "$SOURCE_FOLDER")
FOLDER_NAME="$BASE_FOLDER_NAME-$(date +%d%m%Y)-$(date +%H%M%S)"

# Create the backup copy
cp -r "$SOURCE_FOLDER" "$DESTINATION_DIRECTORY/$FOLDER_NAME"
# Max 7 backups, delete the oldest
BACKUP_FOLDERS=($(ls -1d $DESTINATION_DIRECTORY/${BASE_FOLDER_NAME}-* 2>/dev/null | sort))

if [ "${#BACKUP_FOLDERS[@]}" -gt 7 ]; then
  OLDEST_BACKUP=${BACKUP_FOLDERS[0]}
  rm -rf "$OLDEST_BACKUP"
  echo "Deleted oldest backup: $OLDEST_BACKUP"
fi

echo "Backup of '$SOURCE_FOLDER' created at '$DESTINATION_DIRECTORY/$FOLDER_NAME'."
