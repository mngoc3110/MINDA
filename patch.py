import re

with open('/Users/macbook/Desktop/coding/projects/MINDA/student-center/backend/app/api/endpoints/assignments.py', 'r') as f:
    content = f.read()

# Modify get_practice_assignments
content = content.replace(
    'item = resp.model_dump()',
    'item = resp.model_dump(exclude={"quiz_data"})'
)

# Modify teacher_dashboard_assignments
content = content.replace(
    'resp_dict = AssignmentResponse.model_validate(a).model_dump()',
    'resp_dict = AssignmentResponse.model_validate(a).model_dump(exclude={"quiz_data"})'
)

# Modify list_assignments
content = content.replace(
    '@router.get("/courses/{course_id}/assignments", response_model=List[AssignmentResponse])',
    '@router.get("/courses/{course_id}/assignments", response_model=List[AssignmentResponse], response_model_exclude={"quiz_data"})'
)

with open('/Users/macbook/Desktop/coding/projects/MINDA/student-center/backend/app/api/endpoints/assignments.py', 'w') as f:
    f.write(content)

