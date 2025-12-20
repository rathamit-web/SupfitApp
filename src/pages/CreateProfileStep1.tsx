import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import supfitLogo from '../assets/Supfitlogo.png';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateProfileStep2 from './CreateProfileStep2';
import CreateProfileStep3 from './CreateProfileStep3';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const genders = [
	{ label: 'Male', value: 'male' },
	{ label: 'Female', value: 'female' },
	{ label: 'Other', value: 'other' },
];

const CreateProfileStep1 = () => {
	const [searchParams] = useSearchParams();
	const role = searchParams.get('role') || 'individual';
	const navigate = useNavigate();

	const [formData, setFormData] = useState({
		name: '',
		age: '',
		gender: '',
		bio: '',
		avatar: '',
	});
	const [step, setStep] = useState(1);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = () => {
		localStorage.setItem('userProfile', JSON.stringify(formData));
		localStorage.setItem('profileCreated', 'true');
		if (role === 'coach') navigate('/coach-home');
		else navigate('/home');
	};

	// Step 1 UI
	const [selectedGender, setSelectedGender] = useState(formData.gender || '');
	const handleGenderSelect = (gender: string) => {
		setSelectedGender(gender);
		handleInputChange('gender', gender);
	};

	return (
		<div
			style={{
				minHeight: '100vh',
				background: 'linear-gradient(135deg, #e0e7ff 0%, #f5d0fe 100%)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: 'SF Pro Display, SF Pro Text, Roboto, Arial, sans-serif',
			}}
		>
			<Card
				className="w-full"
				style={{
					background: 'rgba(255,255,255,0.65)',
					borderRadius: '10px',
					boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
					border: '1.5px solid rgba(255,255,255,0.25)',
					backdropFilter: 'blur(18px) saturate(180%)',
					WebkitBackdropFilter: 'blur(18px) saturate(180%)',
					padding: '20px 20px 28px',
					maxWidth: '370px',
					width: '100%',
					margin: '0 auto',
					position: 'relative',
				}}
			>
				<CardHeader>
					<div
						style={{
							width: '100%',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'flex-start',
							marginBottom: 0,
							marginTop: 0,
						}}
					>
						<img
							src={supfitLogo}
							alt="Supfit"
							style={{
								width: '150px',
								maxWidth: '60vw',
								height: 'auto',
								background: 'transparent',
								borderRadius: 0,
								boxShadow: 'none',
								filter: 'drop-shadow(0 2px 12px #ff3c2066)',
								margin: 0,
								verticalAlign: 'middle',
								display: 'block',
							}}
						/>
					</div>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: 16,
						}}
					>
						<span
							style={{
								fontWeight: 700,
								fontSize: 20,
								color: '#222',
								letterSpacing: '-0.5px',
							}}
						>
							Create Profile
						</span>
						<span
							style={{
								color: '#888',
								fontWeight: 500,
								fontSize: 15,
							}}
						>
							Step {step} of 3
						</span>
					</div>
					<div
						style={{
							height: 4,
							background: 'linear-gradient(90deg, #ff3c20 40%, #eee 60%)',
							borderRadius: 2,
							marginBottom: 24,
						}}
					/>
				</CardHeader>
				<CardContent>
					<form
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
						}}
					>
						{step === 1 && (
							<>
								<h2
									style={{
										color: '#ff3c20',
										fontWeight: 800,
										fontSize: 28,
										marginBottom: 8,
									}}
								>
									Let's Get Started
								</h2>
								<p
									style={{
										color: '#666',
										fontSize: 16,
										marginBottom: 28,
									}}
								>
									Tell us a bit about yourself.
								</p>
								<div style={{ marginBottom: 18 }}>
									<Label
										htmlFor="name"
										style={{
											fontWeight: 600,
											fontSize: 16,
											color: '#222',
										}}
									>
										Full Name
									</Label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) =>
											handleInputChange('name', e.target.value)
										}
										placeholder="Full Name"
										style={{
											fontSize: 18,
											padding: '16px',
											borderRadius: 12,
											marginTop: 6,
											background: '#fafafa',
											border: '1px solid #eee',
										}}
										required
									/>
								</div>
								<div style={{ marginBottom: 18 }}>
									<Label
										htmlFor="age"
										style={{
											fontWeight: 600,
											fontSize: 16,
											color: '#222',
										}}
									>
										Age
									</Label>
									<Input
										id="age"
										type="number"
										value={formData.age || ''}
										onChange={(e) =>
											handleInputChange('age', e.target.value)
										}
										placeholder="Age"
										style={{
											fontSize: 18,
											padding: '16px',
											borderRadius: 12,
											marginTop: 6,
											background: '#fafafa',
											border: '1px solid #eee',
										}}
										required
									/>
								</div>
								<div style={{ marginBottom: 28 }}>
									<Label
										style={{
											fontWeight: 600,
											fontSize: 16,
											color: '#222',
											marginBottom: 8,
										}}
									>
										Gender
									</Label>
									<div
										style={{
											display: 'flex',
											gap: 12,
											marginTop: 8,
										}}
									>
										{genders.map((g) => (
											<button
												key={g.value}
												type="button"
												onClick={() => handleGenderSelect(g.value)}
												style={{
													padding: '8px 20px',
													borderRadius: '7px',
													border:
														formData.gender === g.value
															? '2px solid #ff3c20'
															: '1px solid #eee',
													background:
														formData.gender === g.value
															? 'rgba(255,60,32,0.08)'
															: '#fafafa',
													color:
														formData.gender === g.value
															? '#ff3c20'
															: '#ff3c20',
													fontWeight: 600,
													fontSize: 15,
													cursor: 'pointer',
													transition: 'all 0.2s',
													outline: 'none',
												}}
											>
												{g.label}
											</button>
										))}
									</div>
								</div>
								<Button
									type="button"
									style={{
										width: '100%',
										background: '#ff3c20',
										color: '#fff',
										fontWeight: 700,
										fontSize: 20,
										borderRadius: 16,
										padding: '16px 0',
										marginTop: 8,
										boxShadow: '0 2px 12px rgba(255,60,32,0.12)',
										border: 'none',
									}}
									onClick={() => setStep(2)}
									disabled={
										!formData.name ||
										!formData.age ||
										!formData.gender
									}
								>
									Next
								</Button>
							</>
						)}
						{step === 2 && (
							<CreateProfileStep2
								formData={formData}
								onChange={handleInputChange}
								onNext={() => setStep(3)}
								onBack={() => setStep(1)}
							/>
						)}
						{step === 3 && (
							<CreateProfileStep3 onSubmit={handleSubmit} />
						)}
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default CreateProfileStep1;
