"""Merge employer accounts from an older InternMatch project without changing password hashes.
Usage: python migrate_employer_accounts.py "C:\\path\\to\\old\\InternMatch\\employers.json"
Stop both servers and back up both files before using.
"""
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
TARGET = HERE / 'employers.json'


def read_accounts(path):
    data = json.loads(path.read_text(encoding='utf-8')) if path.exists() else []
    if not isinstance(data, list):
        raise ValueError(f'{path} must contain an array')
    return data


def main():
    if len(sys.argv) != 2:
        print('Usage: python migrate_employer_accounts.py "path/to/old/employers.json"')
        return 2
    old = Path(sys.argv[1]).expanduser().resolve()
    if not old.is_file():
        print(f'Cannot find the original file: {old}')
        return 2
    if old == TARGET.resolve():
        print('Source and destination are the same file. No migration needed.')
        return 2
    original = read_accounts(old)
    current = read_accounts(TARGET)
    emails = {str(a.get('email', '')).casefold() for a in current}
    ids = {str(a.get('id', '')) for a in current}
    additions = []
    for account in original:
        if not isinstance(account, dict):
            continue
        email = str(account.get('email', '')).casefold()
        identifier = str(account.get('id', ''))
        if not email or not identifier or not account.get('password_hash'):
            continue
        if email in emails or identifier in ids:
            continue
        additions.append(account)
        emails.add(email)
        ids.add(identifier)
    if not additions:
        print('No new employer accounts to migrate. Existing accounts were preserved.')
        return 0
    if TARGET.exists():
        stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup = TARGET.with_name(f'employers.backup.{stamp}.json')
        shutil.copy2(TARGET, backup)
        print(f'Backup: {backup}')
    tmp = TARGET.with_suffix('.migration.tmp')
    tmp.write_text(json.dumps(current + additions, ensure_ascii=False, indent=2), encoding='utf-8')
    tmp.replace(TARGET)
    print(f'Migrated {len(additions)} employer account(s), preserving password hashes.')
    print('Employer-posted jobs are not migrated by this tool.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
