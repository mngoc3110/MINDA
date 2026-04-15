from pydantic import BaseModel
from typing import Optional

class AssignmentResponse(BaseModel):
    is_assigned_to_all: Optional[bool] = True
    
class MockObj:
    def __init__(self, val):
        self.is_assigned_to_all = val

obj = MockObj(False)
val = AssignmentResponse.model_validate(obj, from_attributes=True)
print(val.model_dump())
