from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional

class EntityImportSpec(ABC):
    @property
    @abstractmethod
    def entity_name(self) -> str:
        """Name of the entity (e.g., 'store', 'product') used in reporting."""
        pass

    @property
    @abstractmethod
    def header_map(self) -> Dict[str, List[str]]:
        """Map of standard target fields to their configurable header aliases."""
        pass

    @property
    @abstractmethod
    def required_fields(self) -> List[str]:
        """List of target fields that are required for validation."""
        pass

    @abstractmethod
    def initialize_duplicates_tracker(self) -> Tuple[set, set]:
        """
        Loads existing records from persistence layer.
        Returns a tuple of sets: (seen_ids, seen_combinations)
        """
        pass

    @abstractmethod
    def validate_row(
        self,
        row_num: int,
        row_dict: Dict[str, Any],
        normalized_cols: Dict[str, Any]
    ) -> List[str]:
        """
        Performs validation checks on a row's raw values.
        Returns a list of validation error strings.
        """
        pass

    @abstractmethod
    def check_duplicate(
        self,
        row_dict: Dict[str, Any],
        normalized_cols: Dict[str, Any],
        seen_ids: set,
        seen_combos: set
    ) -> Tuple[bool, Optional[str], Optional[Tuple]]:
        """
        Deduplicates a row.
        Returns (is_duplicate, duplicate_id_to_add, duplicate_combo_key_to_add)
        """
        pass

    @abstractmethod
    def normalize_row_for_db(
        self,
        row_dict: Dict[str, Any],
        normalized_cols: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Transforms raw spreadsheet field values into database schema attributes.
        """
        pass

    @abstractmethod
    def commit_chunk(self, valid_records: List[Dict[str, Any]]) -> None:
        """
        Commits/persists a chunk of valid records to the database/file system.
        """
        pass
